#!/usr/bin/env fish_test

set -l file_dir (dirname (status -f))
source $file_dir/../convert_to_webm.fish

function setup
    set -g temp_dir (mktemp -d)
    cd $temp_dir
    trap teardown EXIT
end

function teardown
    cd -
    command rm -rf $temp_dir
end

function create_test_video
    set -l filename $argv[1]

    ffmpeg -f lavfi -i rgbtestsrc -t 1 $filename >/dev/null 2>&1
end

function convert_video
    set -l filename_without_extension $argv[1]
    set -l extension $argv[2]

    set -l input_file "$filename_without_extension.$extension"
    create_test_video $input_file
    convert_and_update_video $input_file

    # Check file exists and is non-empty
    if ! test -s "$filename_without_extension.webm"
        echo "File does not exist or is empty"
    end

    set -l old_size (stat -f%z $input_file)
    set -l new_size (stat -f%z "$filename_without_extension.webm")
    # Check that new size is less than half of old size
    if test $new_size -gt (math $old_size / 2)
        echo "New size is not less than half of old size"
    end

    echo 0
end

for ext in $ALLOWED_EXTENSIONS # From convert_to_webm.fish
    @test "convert_and_update_video converts $ext to WebM" (
        setup
        convert_video "test" $ext
    ) = 0
end

@test "convert_and_update_video fails with non-existent file" (
    setup
    convert_and_update_video "non_existent_file.mp4" 2>/dev/null
    echo $status
) = 1

@test "convert_and_update_video skips unsupported file types" (
    setup
    set -l input_file "test.txt"
    touch $input_file

    convert_and_update_video $input_file 2>/dev/null
    echo $status
) = 1

@test "convert_and_update_video handles filenames with spaces" (
    setup
    convert_video "test file" "mp4"
) = 0
