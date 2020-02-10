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
# a movie
# =================================

tubidl -mc 5 -u 'https://tubitv.com/movies/465487/citizenfour'

# ------------------------------------------------------------------------------

# =================================
# an episode
# =================================

tubidl -mc 5 -u 'https://tubitv.com/tv-shows/498780/s01_e02_the_grand_deception_part_2'

# ------------------------------------------------------------------------------

# =================================
# a series
# =================================

tubidl -mc 5 -u 'https://tubitv.com/series/4068/the_greatest_american_hero'

# ------------------------------------------------------------------------------
