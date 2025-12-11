@echo off
:build
    cls
    npx babel src --extensions ".ts,.js" --out-dir dist --copy-files