#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
workspace="${DIR}/workspace"

[ -d "$workspace" ] && rm -rf "$workspace"
mkdir "$workspace"
cd "$workspace"

npm init -y
npm install --save "${DIR}/.."
clear

PATH="${workspace}/node_modules/.bin:${PATH}"

# ------------------------------------------------------------------------------

# =================================
# download a movie
# =================================

tubidl -q -mc 5 -u 'https://tubitv.com/movies/300443/1984'

# ------------------------------------------------------------------------------

# =================================
# download an episode
# =================================

tubidl -q -mc 5 -u 'https://tubitv.com/tv-shows/200255733/s01-e01-where-is-everybody'

# ------------------------------------------------------------------------------

# =================================
# download a series
# =================================

tubidl -mc 5 -u 'https://tubitv.com/series/300017350/the-twilight-zone'

# ------------------------------------------------------------------------------

# =================================
# print a trace of the operations
# that would occur IF a series
# were to be downloaded
# =================================

tubidl -dr -ll 1 -u 'https://tubitv.com/series/300017350/the-twilight-zone'
tubidl -dr -ll 2 -u 'https://tubitv.com/series/300017350/the-twilight-zone'
tubidl -dr -ll 3 -u 'https://tubitv.com/series/300017350/the-twilight-zone'

# ------------------------------------------------------------------------------

# =================================
# download a series (advanced)
# =================================

tubidl -dr -ll 1 -u 'https://tubitv.com/series/300017350/the-twilight-zone' >'episode_urls.txt'
tubidl -dr -ll 2 -u 'https://tubitv.com/series/300017350/the-twilight-zone' >'convert_mp4s.sh'

tubidl -nm -mc 5 -i 'episode_urls.txt' >'log.txt' 2>&1

./convert_mp4s.sh

# ------------------------------------------------------------------------------
