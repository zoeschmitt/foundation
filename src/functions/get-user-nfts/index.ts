import { handlerPath } from '../../utils/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: "get",
        path: "getUserNFTs",
        cors: true,
        private: true,
      },
    },
  ],
};
