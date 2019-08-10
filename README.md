# HOME Router
A NodeJS reverse proxy with full authentication that has support for MFA applications such as Google Authenticator.

## What does HOME Router do?
HOME Router allows for easy proxying of anything and allows you to put a strong authentication system in front of any page (note: NOT for production security, this is mainly for securing development environments). The great part about this reverse proxy is that you do not need to port forward every single application, with this you just open one port (by default, 80) and we'll take care of the rest.

## How do I use HOME Router?
1. Setup your domain
    - HOME Router is based upon subdomains, so you need to configure your DNS to use it properly.
    - First, setup an A name that points to your server, e.g `home`
    - Next, setup a wildcard A name under the previous subdomain, e.g `*.home` (or, you can do it on a per-service basis, just make sure you at least have (home here is the main dashboard page) `home`, `auth.home`, and `unauthed.home` (unauthed is a redirect proxy, it may change in the future))
2. Make sure MongoDB is running
3. Change the baseURL in config.js to your URL (include the first subdomain)
4. Change the baseURL in `.\dashboard\frontend\assets\main.js` to your URL (include the first subdomain)
5. Change the logo if ya want!
6. Run `sudo node .\dashboard\dashboard.js`
    - NOTE: Usually you must run as sudo because it is binding to port 80!
7. Done!

Really, it's THAT easy! The default login (will soon be) the username admin and the password ilovehomerouter. You will need to immediately reset this and connect to your MFA of choice.

## Use Cases
Personally, I use HOME Router on my home network to allow me to access Guacamole, VSCode, and developmental servers while remaining safe and secure. I really like knowing that even if a piece of premade software doesn't already have an authentication system that I can trust HOME Router to handle it for me, while being able to use MFA! It's also pretty nice how it works across applications, so it's all Single Sign On and then cookie-based from there. 

Are you using HOME Router? Leave an issue with your use case and I'll add it here!

## How can I help out?
The Trello for all upcoming features is here, take a look if you would like! https://trello.com/b/UPlQNXcH/home-router

Also, if you would like to monetarily support the creator, you can do so here: https://www.paypal.com/paypalme2/kentonv, I appreciate any support, from helping by fixing an issue on here to a little donation, everything helps!