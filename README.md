##**Tinyphone Server**
The Tinyphone server's purpose is to act as a bridge between the Asterisk telephone server, and real-time apps in various languages.

The typical use case for Tinyphone server is to allow phone call controlled screens in public spaces.  Calls are handled by Asterisk and passed to Tinyphone server through AGI / EAGI.  Tinyphone server will forward the call events to any Tinyphone clients that are registered with the "DNID" phone number of the call.

Tinyphone has 4 events that are received from Asterisk and passed to Tinyphone clients:
 - **new_caller:**
  - A new call has begun.  Tinyphone clients are informed of the call's unique ID, the caller's phone number (callerID), and any arguments that have been passed in to AGI from Asterisk's dialplan.
 - **keypress:**
  - The caller has hit a key on their dialpad.  The value will be 0-9,*, or #.
 - **audio_level:**
  - The current loudness of the caller's audio, from 0-32768.  This event will be sent approximately 15 times / second, and requires that EAGI (instead of AGI) is used in the Asterisk dial plan.  This event is bandwidth/cpu intensive, so use AGI unless your application is definitely using audio level events.
 - **hangup:**
  - The caller has hung up the phone.

Tinyphone requires a basic understanding of Asterisk, Ruby, Node.js, and linux.  It was designed for a class at NYU's [Interactive Telecommunications Program][1] called "[Redial][2]". 

**Setting up your Linux server for Tinyphone**

Tinyphone Server has been tested with Node.js 0.4.x, and Asterisk 1.8/ Asterisk 10.

**Required:** Asterisk PBX, Node.js, Ruby, ruby-agi gem, Socket.io, Inbound VOIP phone service.  Tinyphone server has been tested with [Flowroute](http://www.flowroute.com) and [IPKall](http://ipkall.com) for phone service.

**Optional:** Forever (a node.js daemon app) 

[Click here for instructions on setting up a Rackspace Cloud server for Tinyphone.](http://www.itp-redial.com/class/weekly-notes/week-7-notes/asterisk-on-rackspace-cloud)  If you know what you're doing, you can use these instructions as a guide to set up just about any Linux machine for Tinyphone.

**Installing Tinyphone**

Move to the directory where you want to install Tinyphone. For example, you may want to install it in your Cloud9 workspace folder.

    cd ~/node_workspace
Check out the code from GitHub.

    git clone git://github.com/itp-redial/tinyphone
Install Socket.io, if it’s not installed already.

    npm install socket.io -g
Set NODE_PATH, if necessary.

    export NODE_PATH=/usr/lib/node_modules/
    echo "export NODE_PATH=$NODE_PATH" >> ~/.bashrc
Tinyphone Server has two components: A node app called tinyphone\_server.js in the tinyphone\_server directory, and tinyphone\_eagi\_client.rb located in the tinyphone_eagi directory.

For convenience, the instructions will assume that you are in the tinyphone\_server directory. You can also put the full path to tinyphone\_server.js

    cd tinyphone/tinyphone_server
By default, Tinyphone will accept local AGI connections on port 12001, Remote TCP connections on 12002, and Socket.io connections on port 12003. For now, the only way to change the ports is to edit tinyphone_server.js. Hopefully in the near future I’ll add a config file.

You can temporarily run Tinyphone Server by running **“node tinyphone_server.js”** but I would recommend using [**Forever**](https://github.com/nodejitsu/forever). Forever is a nifty app that will run Node apps as a background service.

    npm install forever -g

Start using forever:

    forever start tinyphone_server.js

Stop with Forever:

    forever stop tinyphone_server.js

Tinyphone uses an AGI script to communicate with Asterisk. Tinyphone comes with a ruby AGI script that will send the appropriate events to Tinyphone, and will parse the audio for peak levels if EAGI is used.
The ruby-agi gem is broken on Ubuntu systems, so you may need to patch it. You may want to look at this install script for guidance on patching ruby-agi if it’s crashing.

    http://www.itp-redial.com/class/wp-content/uploads/2012/02/cloud_server_setup.txt

**IMPORTANT:**: Audio level events will dramatically increase the bandwidth to/from the server, so only use EAGI if your client uses audio levels.

**ALSO IMPORTANT**: If you’re using IPKall for incoming calls, you will need to manually set the correct dialed number.  By default the inbound extension will be your IPKall ID, which will mess up the routing in Tinyphone.

    exten => ipkallchris,n,Set(CALLERID(DNID)=13605162010)
 
    [inbound]
    exten => _X.,1,Answer()
    ;you will need to set the inbound phone number if you're using IPKall
    ;not necessary if you're using flworoute, or most other VOIP providers.
    exten => _X.,n,Set(CALLERID(DNID)=13605162099)
    exten => _X.,n,Goto(tinyphone,s,1)
    
    [tinyphone]
    ;replace with EAGI if you want audio levels
    exten => s,1,AGI(/root/node_workspace/tinyphone/tinyphone_eagi/tinyphone_eagi_client.rb)
    exten => s,n,Hangup()


**Passing arguments to Tinyphone apps:**
The Tinyphone AGI script will pass along any arguments to the tinyphone clients, and will be part of the new_caller event in tinyphone apps.  You can pass in multiple arguments and they will be available as an array to tinyphone clients.
    [tinyphone]
    exten => s,1,Set(message=Hello tinyphone!)
    ;the value of variable "message" will get sent to the tinyphone clients.
    exten => s,n,AGI(/root/node_workspace/tinyphone/tinyphone_eagi/tinyphone_eagi_client.rb,${message})
    exten => s,n,Hangup()

  [1]: http://itp.nyu.edu
  [2]: http://www.itp-redial.com