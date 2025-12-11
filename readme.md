# HyperModV2
- the new HyperMod!

to build it, run the `installPackages.sh` file (linux), or the `installPackages.cmd` file (windows)  
then, run the `build.sh` / `build.cmd` file  
now, you can just do `node index` and it open HyperModV2 at [localhost:8080](http://localhost:8080/)!
*(ignore the warning when you run the file)*

# Warning
## ⚠ please do not use HyperMod until this issue is resolved! ⚠
unfortunately, an issue with the client causes it to fail MPP's AntiBot.  
this causes a 24 hour siteban for any client that connects using HyperMod.  
i can't fix this issue until a server admin gives me details on what AntiBot checks are failing.

## Features
- faster piano
- infinite note quota (can be disabled in settings)
- desktop notifications when mentioned (can be disabled in settings)
- a whole custom menu for HyperMod settings
- customization options
- a MIDI player
- an NPS tracker
- the ability to see when others are typing (if that person is also using HyperMod)
- more later, hopefully, if i can think of smth to add

## Optional Steps
- to minify the build for slightly more speed, run `node terserBuild`