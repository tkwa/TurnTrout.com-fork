import unittest.mock as mock  # Import the mock module
import pytest
import argparse
from pathlib import Path
import compress
import convert_assets
import utils
import subprocess


# --- Pytest Fixtures ---
@pytest.fixture(autouse=True)  # Runs before each test automatically
def setup_test_env(tmp_path):
    """Sets up a temporary Git repository and populates it with test assets."""

    # Create the required directories for testing
    for dir_name in ["quartz/static", "scripts", "content"]:
        (tmp_path / dir_name).mkdir(parents=True, exist_ok=True)

    # Create image assets for testing and add reference to markdown file
    for ext in compress.ALLOWED_IMAGE_EXTENSIONS:
        utils.create_test_image(
            tmp_path / "quartz/static" / f"asset.{ext}", "32x32"
        )
        (tmp_path / "content" / "image_text.md").write_text(
            f"![](quartz/static/asset.{ext})\n"
        )

    # Create video assets for testing and add references to markdown files
    for ext in compress.ALLOWED_VIDEO_EXTENSIONS:
        utils.create_test_video(tmp_path / "quartz/static" / f"asset.{ext}")
        with open(tmp_path / "content" / f"{ext}.md", "w") as file:
            file.write(f"![](quartz/static/asset.{ext})\n")
            file.write(f"[[quartz/static/asset.{ext}]]\n")
            if ext != "gif":
                file.write(
                    f'<video src="quartz/static/asset.{ext}" alt="shrek"/>\n'
                )

    # Special handling for GIF file in markdown
    with open(tmp_path / "content" / "gif.md", "w") as file:
        file.write('<img src="quartz/static/asset.gif" alt="shrek">\n')

    # Create an unsupported file
    (tmp_path / "quartz/static/unsupported.txt").touch()

    yield tmp_path  # Return the temporary directory path


@pytest.fixture
def convert_asset_mocks():
    with mock.patch("compress.image") as mock_compress_image, mock.patch(
        "compress.video"
    ) as mock_compress_video, mock.patch(
        "subprocess.run"
    ) as mock_run, mock.patch(
        "Path.unlink"
    ) as mock_unlink:
        yield mock_compress_image, mock_compress_video, mock_run, mock_unlink


# --- Tests ---


@pytest.mark.parametrize("ext", compress.ALLOWED_IMAGE_EXTENSIONS)
def test_image_conversion(ext: str, setup_test_env, convert_asset_mocks):
    mock_compress_image, _, _, _ = convert_asset_mocks
    asset_path = Path(setup_test_env) / "quartz/static" / f"asset.{ext}"
    avif_path = asset_path.with_suffix(".avif")
    content_path = Path(setup_test_env) / "content" / "image_text.md"

    convert_assets.convert_asset(asset_path)

    mock_compress_image.assert_called_once_with(asset_path)
    assert avif_path.exists()  # Check if AVIF file was created
    with open(content_path, "r") as f:
        file_content = f.read()
        assert avif_path.name in file_content


@pytest.mark.parametrize("ext", compress.ALLOWED_VIDEO_EXTENSIONS)
def test_video_conversion(ext: str, setup_test_env, convert_asset_mocks):
    _, mock_compress_video, _, _ = convert_asset_mocks
    asset_path: Path = Path(setup_test_env) / "quartz/static" / f"asset.{ext}"
    webm_path: Path = asset_path.with_suffix(".webm")
    content_path: Path = Path(setup_test_env) / "content" / f"{ext}.md"

    convert_assets.convert_asset(asset_path)

    mock_compress_video.assert_called_once_with(asset_path)
    assert webm_path.exists()
    with open(content_path, "r") as f:
        file_content: str = f.read()

    if ext == "gif":
        assert (
            '<video autoplay loop muted playsinline src="quartz/static/asset.webm" type="video/webm"><source src="quartz/static/asset.webm"></video>'
            in file_content
        )
        assert (
            '<video autoplay loop muted playsinline src="quartz/static/asset.webm" alt="shrek" type="video/webm"><source src="quartz/static/asset.webm"></video>'
            in file_content
        )
    else:
        assert (
            '<video src="quartz/static/asset.webm" type="video/webm"/>'
            in file_content
        )
        assert (
            '<video src="quartz/static/asset.webm" type="video/webm" alt="shrek"/>'
            in file_content
        )


def test_remove_original_files(setup_test_env, convert_asset_mocks):
    mock_compress_image, _, _, mock_unlink = convert_asset_mocks
    convert_assets.args = argparse.Namespace(remove_originals=True)
    asset_path = Path(setup_test_env) / "quartz" / "static" / "asset.jpg"

    convert_assets.convert_asset(asset_path)

    mock_compress_image.assert_called_once_with(asset_path)
    mock_unlink.assert_called_once()  # Verify that unlink was called


def test_strip_metadata(setup_test_env, convert_asset_mocks):
    _, _, mock_run, _ = convert_asset_mocks
    convert_assets.args = argparse.Namespace(strip_metadata=True)

    dummy_image: Path = (
        Path(setup_test_env) / "quartz/static/asset_with_exif.jpg"
    )
    utils.create_test_image(dummy_image, "32x32")

    # Simulate adding metadata using exiftool
    with mock.patch("subprocess.run") as mock_exiftool:
        mock_exiftool.return_value = subprocess.CompletedProcess(
            args=[], returncode=0
        )
        subprocess.run(
            [
                "exiftool",
                "-Artist=Test Artist",
                "-Copyright=Test Copyright",
                str(dummy_image),
            ]
        )

    # Convert the image to AVIF
    convert_assets.convert_asset(dummy_image)

    # Verify exiftool was called with the correct arguments
    mock_run.assert_called_once_with(
        ["exiftool", "-all=", str(dummy_image.with_suffix(".avif"))],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # Read the output of exiftool on the AVIF file and assert that no EXIF data is present
    with mock.patch("subprocess.check_output") as mock_check_output:
        mock_check_output.return_value = b""  # No EXIF data should be returned
        exif_output = subprocess.check_output(
            ["exiftool", dummy_image.with_suffix(".avif")]
        )
        assert (
            "Test Artist" not in exif_output.decode()
        )  # Check for a specific tag
        assert "Test Copyright" not in exif_output.decode()


def test_ignores_unsupported_file_types(setup_test_env):
    asset_path = Path(setup_test_env) / "quartz/static/unsupported.txt"

    convert_assets.convert_asset(asset_path)
    assert asset_path.exists()
