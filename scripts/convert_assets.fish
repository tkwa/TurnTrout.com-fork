#!/usr/bin/env fish

# Initialize argparse
argparse r/remove-originals s/strip-metadata run_script -- $argv

# Set boolean variables based on provided flags
set -g remove_originals false
set -g strip_metadata false
set -g run_script false
if set -q _flag_remove_originals
    set -g remove_originals true
end
if set -q _flag_strip_metadata
    set -g strip_metadata true
end
if set -q _flag_run_script
    set -g run_script true
end

set -l FILE_DIR (dirname (status -f))
source $FILE_DIR/convert_to_webm.fish 2>/dev/null
source $FILE_DIR/convert_to_avif.fish 2>/dev/null
source $FILE_DIR/utils.fish
source $FILE_DIR/update_references.fish 2>/dev/null

# Function to handle conversion and optimization of a single file
function convert_asset
    set -l input_file $argv[1]
    set -l input_ext (string replace -r '^.+\.' '' $input_file)
    set -g output_file ""

    switch $input_ext
        case jpg jpeg png
            convert_to_avif $input_file
            set -g output_file (replace_extension $input_file avif)

            update_references $input_file $output_file "$GIT_ROOT/content"

        case $VIDEO_EXTENSIONS_TO_CONVERT
            set -g output_file (replace_extension $input_file webm)
            convert_and_update_video $input_file
            if test $status -ne 0
                echo "Failed to convert $input_file to WebM" >&2
                return 1
            end

            set -l base (basename "$input_file")
            set -l base_name_no_ext (string replace -r '\.[^.]*$' '' "$base")

            # If replacing a gif, we need to tag the video element
            set -g original_pattern "\!?\[\]\((?<link>[^\)]*)$base_name_no_ext\.$input_ext\)"
            set -g original_pattern "$original_pattern|\[\[(?<link>[^\]]*)$base_name_no_ext\.$input_ext\]\]"
            if test $input_ext = gif
                # TODO add support for alt-text?
                set -g original_pattern "$original_pattern|<img (?<earlyTagInfo>[^>]*)src=\"(?<link>[^\"]*)$base_name_no_ext\.gif\"(?<tagInfo>[^>]*)\/?>"
                set -g replacement_pattern "<video autoplay loop muted playsinline src=\"\$+{link}$base_name_no_ext.webm\"\$+{earlyTagInfo}\$+{tagInfo} type=\"video/webm\"><source src=\"\$+{link}$base_name_no_ext.webm\"></video>"
            else
                set -g original_pattern "$original_pattern|<video (?<earlyTagInfo>[^>]*)src=\"(?<link>[^\"]*)$base_name_no_ext\.$input_ext\"(?<tagInfo>.*)(?:type=\"video/$input_ext\")?(?<endVideoTagInfo>[^>]*(?=/))\/?>"
                set -g replacement_pattern "<video src=\"\$+{link}$base_name_no_ext.webm\"\$+{earlyTagInfo} type=\"video/webm\"\$+{tagInfo}\$+{endVideoTagInfo}/>"
            end

            perl_references $original_pattern $replacement_pattern "$GIT_ROOT/content"

        case '*'
            return 0
    end

    # Strip Metadata (If --strip-metadata flag is provided)
    if test $strip_metadata = true
        # Use exiftool to remove metadata
        exiftool -all= $output_file >/dev/null 2>&1

        # Verify if metadata removal was successful
        if test $status -ne 0
            echo "Failed to strip metadata from $output_file" >&2
        end
    end

    # Remove Original File (If --remove-originals flag is provided)
    if test "$remove_originals" = true
        if not tp $input_file
            echo "Failed to remove original file $input_file" >&2
        end
    end
end

# Traverse through all files in the specified directory and subdirectories
if $run_script
    find $GIT_ROOT/quartz/static -type f ! -name '.DS_Store' | while read -l file
        convert_asset $file
    end
end
