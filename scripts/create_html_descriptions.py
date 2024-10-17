"""
This script creates HTML descriptions for blog posts by generating them using
the Gemini 1.5 Pro model from Google Generative AI.

It reads the content of each Markdown file, extracts the YAML front matter, and if no description is found, generates one.
The generated description is then saved back to the file.
"""

from io import StringIO
import os
import re
from pathlib import Path
from ruamel.yaml import YAML
import google.generativeai as genai  # type: ignore
from google.generativeai.types import HarmCategory, HarmBlockThreshold  # type: ignore


try:
    from . import utils as script_utils
except ImportError:
    import utils as script_utils  # type: ignore


# Configure the Gemini API (you'll need to set up your API key)
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
yaml_parser = YAML(typ="rt")  # Use Round-Trip to preserve formatting


example_posts: list[str] = [
    "posts",
    "date-me",
    "bruce-wayne-and-the-cost-of-inaction",
    "danger-of-suggestive-terminology",
]


def prepare_few_shot_examples() -> str:
    """
    Prepare few-shot examples from the example posts.
    """
    few_shot_examples = ""
    for post in example_posts:
        post_path = Path(f"content/{post}.md")
        if post_path.exists():
            with open(post_path, "r", encoding="utf-8") as file:
                post_content = file.read()
            yaml_match = re.match(r"^---\n(.*?)\n---", post_content, re.DOTALL)
            if yaml_match:
                yaml_content = yaml_match.group(1)
                data = yaml_parser.load(yaml_content)
                if "description" in data:
                    few_shot_examples += f"""
Example post content (first 4000 characters):
{post_content[:4000]}  # Limiting to first 4000 characters for brevity

Description:
{data['description']}

"""
    return few_shot_examples


safety_settings = {
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}


def get_gemini_description(content: str) -> str:
    """
    Generate a description for a blog post using the Gemini 1.5 Pro model.
    """
    model = genai.GenerativeModel("gemini-1.5-pro")
    prompt = f"""
    Based on the following content, write a concise description for a blog post. Offer a factual, neutral summary of the content. 

    The description should be engaging, accurate, and between 20-30 words long. IT CANNOT BE LONGER THAN 140 CHARACTERS. Do not say things like 'this post is about...' or 'this article covers.' Write how George Orwell would describe the post. 
    
    I wrote the content being summarized, so it's ok to be a bit more personal or refer to the author in first person. EG instead of 'the author thinks X', write 'I think X' -- but only do this for more personal posts, not for technical ones."""

    few_shot_examples = prepare_few_shot_examples()

    prompt += few_shot_examples

    prompt += f"""
    The post you are summarizing is:
    {content[:20000]}
    """
    response = "*" * 161
    num_retries = 0
    while len(response) > 160 and num_retries < 3:
        response = model.generate_content(
            prompt, safety_settings=safety_settings
        ).text.strip()
        num_retries += 1
        if num_retries > 0:
            print(f"Retrying... ({num_retries})")
    return response


def process_file(file_path: Path) -> None:
    """
    Process a single file, extract YAML front matter, generate a description if needed, and update the file.
    """
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()

    # Extract YAML front matter
    yaml_match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if yaml_match:
        yaml_content = yaml_match.group(1)
        data = yaml_parser.load(yaml_content)

        if "description" not in data or not data["description"]:
            print(f"No description found in {file_path}. Generating one...")

            while True:
                generated_description = get_gemini_description(content)
                print(
                    f"Generated description: {generated_description}\nLength: {len(generated_description)}"
                )

                user_input = input("Accept this description? (yes/no): ").lower()
                if user_input == "yes":
                    data["description"] = generated_description
                    break
                elif user_input == "no":
                    print("Generating a new description...")
                else:
                    print("Invalid input. Please enter 'yes' or 'no'.")

            # Update the file with the new YAML front matter
            yaml_stream = StringIO()
            yaml_parser.dump(data, yaml_stream)
            updated_yaml = yaml_stream.getvalue()
            updated_content = re.sub(
                r"^---\n.*?\n---",
                f"---\n{updated_yaml}---",
                content,
                flags=re.DOTALL,
            )

            with open(file_path, "w", encoding="utf-8") as file:
                file.write(updated_content)

            print(f"Updated {file_path} with new description.")
        else:
            print(f"Description already exists in {file_path}. Skipping.")
    else:
        print(f"No YAML front matter found in {file_path}. Skipping.")
    print("\n")


def main() -> None:
    """
    Main function to process all Markdown files in the current directory.
    """
    git_root = script_utils.get_git_root()
    if git_root is None:
        raise RuntimeError("Could not find git root")
    directory = git_root / "content"
    for filename in os.listdir(directory):
        if filename.endswith(".md"):
            file_path = os.path.join(directory, filename)
            process_file(Path(file_path))


if __name__ == "__main__":
    main()
