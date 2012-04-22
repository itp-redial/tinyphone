##**Tinyphone Server**
The Tinyphone server's purpose is to act as a bridge between the Asterisk telephone server, and real-time apps in various languages.

The typical use case for Tinyphone server is to allow phone call controlled screens in public spaces.  Calls are handled by Asterisk and passed to Tinyphone server through AGI / EAGI.  

Tinyphone requires a basic understanding of Asterisk, Ruby, and Node.js, and linux.  It was designed for a class at NYU's [Interactive Telecommunications Program][1] called "[Redial][2]". 

**Setting up your Asterisk server**

Tinyphone Server has been tested with Node.js 0.4.x, and Asterisk 1.8/ Asterisk 10.

**Required:** Asterisk PBX, Node.js, Ruby, ruby-agi gem, Socket.io, Inbound VOIP phone service.  Tinyphone server has been tested with [Flowroute](http://www.flowroute.com) or [IPKall](http://ipkall.com)

**Optional:** Forever (a node.js daemon app) 

[Click here for instructions on setting up a Rackspace Cloud server for Tinyphone.](http://www.itp-redial.com/class/weekly-notes/week-7-notes/asterisk-on-rackspace-cloud)  If you know what you're doing, you can use these instructions as a guide to set up just about any Linux machine for Tinyphone.

**Setting up Tinyphone**

Move to the directory where you want to install Tinyphone. For example, you may want to install it in your Cloud9 workspace folder.

    cd ~/node_workspace
Check out the code from GitHub.

    git clone git://github.com/itp-redial/tinyphone
Install Socket.io, if it’s not installed already.

    npm install socket.io -g
Set NODE_PATH, if necessary.

    export NODE_PATH=/usr/lib/node_modules/
    echo "export NODE_PATH=$NODE_PATH" >> ~/.bashrc
Tinyphone Server has two components: A node app called tinyphone_server.js in the tinyphone_server directory, and tinyphone_eagi_client.rb located in the tinyphone_eagi directory.

For convenience, the instructions will assume that you are in the tinyphone_server directory. You can also put the full path to tinyphone_server.js

    cd tinyphone/tinyphone_server
By default, Tinyphone will accept local AGI connections on port 12001, Remote TCP connections on 12002, and Socket.io connections on port 12003. For now, the only way to change the ports is to edit tinyphone_server.js. Hopefully in the near future I’ll add a config file.

You can temporarily run Tinyphone Server by running “node tinyphone_server.js” but I would recommend using **Forever**. Forever is a nifty app that will run Node apps as a background service.

    npm install forever -g

Start using forever:

    forever start tinyphone_server.js

Stop with Forever:

    forever stop tinyphone_server.js

Tinyphone uses an AGI script to communicate with Asterisk. Tinyphone comes with a ruby AGI script that will send the appropriate events to Tinyphone, and will parse the audio for peak levels if EAGI is used.
The ruby-agi gem is broken on Ubuntu systems, so you may need to patch it. (Redial students- this is done for you by my install script. Citizens of the internet, you may want to look at this install script for guidance on patching ruby-agi if it’s crashing.)

    http://www.itp-redial.com/class/wp-content/uploads/2012/02/cloud_server_setup.txt

**IMPORTANT:**: Audio level events will dramatically increase the bandwidth to/from the server, so only use EAGI if your client uses audio levels.

**ALSO IMPORTANT**: If you’re using IPKall for incoming calls, you will need to manually set the correct dialed number.  By default the inbound extension will be your IPKall ID, which will mess up the routing in Tinyphone.

    exten => ipkallchris,n,Set(CALLERID(DNID)=13605162010)
 
    [inbound]
    exten => _X.,1,Answer()
    ;you will need to set the inbound phone number if you're using IPKall
    exten => _X.,n,Set(CALLERID(DNID)=13605162099)
    exten => _X.,n,Goto(tinyphone,s,1)
    
    [tinyphone]
    ;replace with EAGI if you want audio levels
    exten => s,1,AGI(/root/node_workspace/tinyphone/tinyphone_eagi/tinyphone_eagi_client.rb)
    exten => s,n,Hangup()


  [1]: http://itp.nyu.edu
  [2]: http://www.itp-redial.com