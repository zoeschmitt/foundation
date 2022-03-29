import { handlerPath } from '../../utils/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "post",
        path: "createWallet",
        cors: true,
        private: true,
        request: {
          schemas: {},
        },
      },
    },
  ],
};
