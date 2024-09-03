#!/usr/bin/env fish

# If there are no arguments passed, then default to the GIT_ROOT public
set -l GIT_ROOT (git rev-parse --show-toplevel)
set -l TARGET_FILES $argv

if test -z "$TARGET_FILES"
    set TARGET_FILES $GIT_ROOT/public/**html
end

# So, the ignore-url syntax is very confusing. 
#  linkchecker only checks those links which *match* the regex. 
#  So if you want to ignore a link, you need to match it with a regex that doesn't match the link.

# Internal links should NEVER 404!
linkchecker $TARGET_FILES --ignore-url="!^\.+.*" --no-warnings

# CDN links should never 404
linkchecker $TARGET_FILES --ignore-url="!^https?://assets\.turntrout\.com" --no-warnings --check-extern
