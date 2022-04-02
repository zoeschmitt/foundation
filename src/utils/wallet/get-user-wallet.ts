import DynamoService from "src/services/dynamo.service";
import { ZUser } from "src/types/z-user.type";

type Props = {
  table: string;
  orgId: string;
  walletId: string;
  dynamoService: DynamoService;
};
const getUserWallet = async (props: Props) => {
  const { table, orgId, walletId, dynamoService } = props;

  const res = await dynamoService.get({
    TableName: table,
    Key: {
      PK: `ORG#${orgId}#WAL#${walletId}`,
      SK: `ORG#${orgId}`,
    },
  });

  if (res === undefined || res.Item === undefined)
    throw `WalletId ${walletId} not found.`;

  return res.Item as ZUser;
};

export default getUserWallet;
