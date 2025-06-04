#!/bin/sh

cd dist 

for f in *.pdf; do
  echo "compressing ${f}"
  gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dNOPAUSE -dQUIET -dBATCH -sOutputFile="/tmp/${f}" "${f}"
  mv "/tmp/${f}" "${f}"
done
