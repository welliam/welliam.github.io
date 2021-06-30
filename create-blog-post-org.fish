#!/usr/local/bin/fish
echo > blog-post/index.org "\
#+TITLE:  Blog posts
#+EMAIL:  well1912@gmail.com
#+HTML_HEAD: <style type="text/css">body {color: #333333; max-width: 50em; margin: auto;} a {color: #333333;}</style>
#+OPTIONS: toc:nil
#+OPTIONS: num:nil
#+OPTIONS: html-postamble:nil"

for post in (ls blog-post | ag -v index | ag -v html)
    set -l name (head -1 ./blog-post/$post | cut -f 2- -d ' ' | xargs)
    echo - [[./$post][$name]] >> blog-post/index.org
end
