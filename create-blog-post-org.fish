#!/usr/local/bin/fish
echo > blog-post/index.org "\
#+TITLE:  Blog posts
#+EMAIL:  well1912@gmail.com
#+HTML_HEAD: <style type="text/css">body {color: #333333; max-width: 50em; margin: auto;} a {color: #333333;}</style>
#+OPTIONS: toc:nil
#+OPTIONS: num:nil
#+OPTIONS: html-postamble:nil"


for post in (
    git ls-files -z -- ./blog-post/ \
    | xargs -0 -n1 -I{} -- sh -c 'git log -1 --format="%at {}" {}  \
    | tail -1' \
    | sort \
    | cut -d " " -f2- \
    | cut -d "/" -f2 \
    | ag -v index \
    | ag -v html)
    set -l name (head -1 ./blog-post/$post | cut -f 2- -d ' ' | xargs)
    set -l date (g log --date=short --follow --format=%ad blog-post/$post | tail -1)
    echo - [[./$post][$name \($date\)]] >> blog-post/index.org
end
