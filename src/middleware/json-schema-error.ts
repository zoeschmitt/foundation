import middy from "@middy/core";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const jsonSchemaError = (): middy.MiddlewareObj<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> => {
  const onError: middy.MiddlewareFn<
    APIGatewayProxyEvent,
    APIGatewayProxyResult
  > = async (req): Promise<any> => {
    if (req.response === undefined)
      req.response = { statusCode: 400, body: "" };

    const request = req as any;

    if (!request.error === undefined || !Array.isArray(request.error.details))
      return {};

    console.log(`jsonSchemaError: ${JSON.stringify(request.error.details)}`);

    request.response.body = JSON.stringify(
      Object.assign({}, request.response.body, {
        errors: request.error.details.map((error) => ({
          detail: error.message,
          ...error.params,
        })),
      })
    );
    return request.response;
  };

  return { onError };
};

export default jsonSchemaError;
