To setup the system

This is using gae-init as build environment
It is not using the latest version so following steps are needed

* Install npm (node js)
* Install google app engine sdk

To start/test the project

* ./build.py -w (will watch the changed files)
* ./build.py -r (this in another window)
* you can now surf to 127.0.0.1:8080 and test the application

For deployment on GAE:

* ./build.py -c
* ./build.py -m
* appcfg.py update .

To fix issues

* Edit the static/src/coffee/site/pdf-to-table.js
* Remove the cacert in your google app engine sdk

```
mv /Applications/GoogleAppEngineLauncher.app/Contents/Resources/GoogleAppEngine-default.bundle/Contents/Resources/google_appengine/lib/cacerts/cacerts.txt cacert.txt_old

```
