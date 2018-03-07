## The nodemon way
1. In terminal, install the node modules

``` npm install ```

2. Then you can run it using either,
    -  ``` npm run react ``` to start React dev server (Users).
       ``` npm run server ``` to start NodeJS Socket.io server.
    -
or just ``` npm run dev ```

**OR**

## The docker way

1. docker build -t ishasaran/chat-service-app:v2 .
2. docker-compose up -d
3. There'll be a message on the terminal as

```
You can now view chat-app in the browser.
web_1  | [0]
web_1  | [0]   Local:            http://localhost:****/
web_1  | [0]   On Your Network:  http://172.**.*.*:****/
```

4. Go to browser and put the URL mentioned in "Local"
