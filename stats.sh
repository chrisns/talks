#!/bin/sh
npm run build:txt  > /dev/null 2>&1

words_per_minute=155

table="Filename,Slides,Words,Minutes"

filter=""
if [ "$1" != "" ]; then
  filter="$1"
fi

for filename in dist/*.txt; do
  base_filename=${filename#dist/}
  base_filename=${base_filename%.txt}
  
  # Skip if filter is provided and doesn't match the filename
  if [ "$filter" != "" ]; then
    case "$base_filename" in
      *"$filter"*) ;;
      *) continue ;;
    esac
  fi

  slidecount=$(grep -- "---" "$filename" | wc -w | tr -d '[:blank:]')
  ((slidecount++))
  if [ "$slidecount" -eq 1 ]; then
    continue
  fi
  wordcount=$(grep -v -- "---" "$filename" | wc -w | tr -d '[:blank:]')
  minutes=$(echo "scale=2; $wordcount / $words_per_minute" | bc)

  filename=${filename#dist/}
  filename=${filename%.txt}
  table+=" ${filename},${slidecount},${wordcount},${minutes}"
done


printf %s\\n ${table} |column -s, -t

echo "\n\n\n\n\n\n\n\n\n\n\n\nExpecting you to run this with watch ./stats.sh"