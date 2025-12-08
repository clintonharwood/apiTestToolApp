module.exports = {
    clients: {
        one: {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLENT_SECRET,
            redirect_uris: ["https://clintox.xyz/callback"],
        },
        two: {
            client_id: process.env.CLIENT_ID_TWO,
            client_secret: process.env.CLENT_SECRET_TWO,
            redirect_uris: ["https://clintox.xyz/callbacknoncommunity"],
        },
        three: {
            client_id: process.env.CLIENT_ID_THREE,
            client_secret: process.env.CLIENT_SECRET_THREE,
            redirect_uris: ["https://clintox.xyz/callbackclientcredsflow"],
        },
        four: {
            client_id: process.env.CLIENT_ID_FOUR,
            client_secret: process.env.CLIENT_SECRET_FOUR,
            redirect_uris: ["https://clintox.xyz/callbackreuse"],
        },
        five: {
            client_id: process.env.CLIENT_ID_FIVE,
            client_secret: process.env.CLIENT_SECRET_FIVE,
            redirect_uris: ["https://clintox.xyz/callbackcodeexchange"],
            username: process.env.UN,
            password: process.env.PW
        }
    },    
    endpoints : {
         authServerOne: {
            authorizationEndpoint:
                "https://test.clintox.xyz/employees/services/oauth2/authorize",
            tokenEndpoint: "https://test.clintox.xyz/employees/services/oauth2/token",
        },
        authServerTwo: {
            authorizationEndpoint:
                "https://clintoxsupport.my.site.com/employees/services/oauth2/authorize",
            tokenEndpoint:
                "https://clintoxsupport.my.site.com/employees/services/oauth2/token",
        },
        salesforceAuthServer: {
            authorizationEndpoint:
                "https://clintoxsupport.my.salesforce.com/services/oauth2/authorize",
            tokenEndpoint:
                "https://clintoxsupport.my.salesforce.com/services/oauth2/token",
        },
        salesforceAuthServerClientCredsFlow: {
            tokenEndpoint:
                "https://clintoxsupport.my.salesforce.com/services/oauth2/token",
        },
        authServerThree: {
            authorizationEndpoint:
                "https://api.clintox.xyz/emp/services/oauth2/authorize",
            tokenEndpoint: "https://api.clintox.xyz/emp/services/oauth2/token",
        },
    }
};