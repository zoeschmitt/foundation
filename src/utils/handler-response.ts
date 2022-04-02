import { StatusCode } from "src/enums/status-code.enum";
import { Status } from "src/enums/status.enum";

const STATUS_MESSAGES = {
  [StatusCode.OK]: Status.SUCCESS,
  [StatusCode.BAD_REQUEST]: Status.BAD_REQUEST,
  [StatusCode.ERROR]: Status.ERROR,
  [StatusCode.NOT_FOUND]: Status.NOT_FOUND,
};
export const handlerResponse = (
  statusCode: StatusCode = StatusCode.OK,
  body: any
) => {
  if (body === undefined && STATUS_MESSAGES[statusCode])
    body["message"] = STATUS_MESSAGES[statusCode];

  return {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    statusCode,
    body: JSON.stringify(body),
  };
};
