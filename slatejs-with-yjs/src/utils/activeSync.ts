import { io } from "socket.io-client";

export class ASClient {

    private socket = null;
    private clientId = null;
    private nextListenerId = 0;
    private nextMsgId = 0;
    private username = null;
    private password = null;
    private proxiedActiveSyncLocation = { protocol: "http:", host: "localhost:8010/proxy" };
    private realActiveSyncLocation = { protocol: "https:", host: "reunion.demo.octopus-news.com" };

    private log(msg) {
        console.log(msg);
    }

    private getHost() {
        return this.proxiedActiveSyncLocation.protocol + "//" + this.proxiedActiveSyncLocation.host;
    }

    private getWSHost() {
        return "ws" + (this.realActiveSyncLocation.protocol === "https:" ? "s" : "") + "://" + this.realActiveSyncLocation.host;
    }

    public getClientId(){
        return (this.clientId);
    }

    private async send(method, url, input, callback) {

        this.log("sending HTTP request: " + input + " to " + url + " via " + method);
        var req = new XMLHttpRequest();
        req.open(method, url, true);
        req.setRequestHeader("Authorization", "Basic YXBpOmFwaQ==");
        req.onreadystatechange = () => {
            if (req.readyState === 4) {
                this.log("received HTTP response: " + req.status + ", " + req.statusText + ", " + req.responseText);
                if (callback != null) {
                    callback(req.status, req.statusText, req.responseText);
                }
            }
        };
        req.send(input);
    }


    private sendToSocket(msgName, msgData) {
        this.log("sending to this.socket.io: " + msgName + " " + JSON.stringify(msgData));
        this.socket.emit(msgName, msgData);
    }

    public start(username, password, sourceName, sourceParams, callbackFn:(message) => void): ASClient {
        this.username = username;
        this.password = password;

        if (this.clientId == null) {
            this.connect(sourceName, sourceParams, callbackFn);
        }
        else {
            this.disconnect(function () { this.connect(username, password, sourceName, sourceParams); });
        }

        return this;
    }

    public runApiHTTPRequest(method, apiPath, requestBody, callbackFn:(status, statusText, response) => void) {
        
        this.send(method, this.getHost() + "/api/v1/" + apiPath, requestBody, callbackFn);
    }

    private connect(sourceName, sourceParams, callbackFn:(message) => void) {
        var connectParams = { "username": this.username, "password": this.password }; 
        this.runApiHTTPRequest("POST","Connection/connect", JSON.stringify(connectParams), (status, statusText, responseText) => {

            this.clientId = JSON.parse(responseText).result.clientId;
            this.log("received this.clientId: " + this.clientId);

            this.socket = io(this.getWSHost());
            var connected = false;
            this.socket.on("connect", () => {
                if (!connected) {
                    this.log("socket.io " + this.socket.id + " connected, sending this.clientId through it");
                    this.sendToSocket("client", { clientId: this.clientId });

                    this.subscribe(sourceName, sourceParams);

                    connected = true;
                }
                else {
                    this.log("socket.io " + this.socket.id + " connected again...");
                }
            });
            this.socket.on("ASMsg", (msg) => {
                this.log("=================== received ASMsg: ===================");
                this.log(msg);
                callbackFn(msg);
            });
            this.socket.on("exception", (msg) => {
                this.log("=================== received exception: ===================");
                this.log(msg);
            });
            this.socket.on("result", (msg) => {
                this.log("=================== received result: ===================");
                this.log(msg);
            });

        });
    }

    private subscribe(sourceName, sourceParams) {
        var sourceName = sourceName;
        var sourceParams = JSON.parse(sourceParams);

        //Add this.clientId and listenerId to the parameters entered into GUI
        sourceParams.source = sourceName;
        sourceParams.listenerId = this.nextListenerId++;

        this.sendToSocket("subscribe", sourceParams);
    }

    private unsubscribe(sourceName) {
        var sourceName = sourceName;
        var sourceParams: any = {};
        sourceParams.source = sourceName;
        sourceParams.listenerId = this.nextListenerId - 1; //we use the previously generated listenerId

        this.sendToSocket("unsubscribe", sourceParams);
    }

    private setFieldValue() {
        let sourceParams: any = {};
        //We assume that the last subscription is to the Rundown source
        sourceParams.source = "Rundown";
        sourceParams.listenerId = this.nextListenerId - 1; //we use the previously generated listenerId
        sourceParams.fieldName = "story.name";
        var rowId = Number(prompt("Enter slugId of target slug"));
        if (isNaN(rowId)) {
            return;
        }
        sourceParams.rowId = rowId;
        sourceParams.value = String(new Date());
        sourceParams.msgId = this.nextMsgId++;

        this.sendToSocket("setFieldValue", sourceParams);
    }

    public disconnect(callback) {
        this.log ("Disconnecting client " + this.clientId + " from AS"); 
        this.send("POST", this.getHost() + "/api/v1/Connection/" + this.clientId + "/disconnect", "", () => {
            this.clientId = null;
            if (callback != null) {
                callback();
            }
        });
    }
}