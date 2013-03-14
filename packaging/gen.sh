#!/bin/bash
if [ -z "$1" ]
then
        echo "Need a pub date, like 22 Nov 2012"
       	exit 1
fi
tempfoo=`basename $0`
TMPFILE=`mktemp -q /tmp/${tempfoo}.XXXXXX`
if [ $? -ne 0 ]; then
       echo "$0: Can't create temp file, exiting..."
       exit 1
fi
anolis --pubdate="$1" --output-encoding=utf8 --omit-optional-tags --quote-attr-values --w3c-compat --w3c-shortname="widgets" --filter=".dontpublish, .now3c" --w3c-status=REC Overview.src.html $TMPFILE
git checkout gh-pages
cp $TMPFILE index.html
git commit -m "Regenerated file"
git checkout master