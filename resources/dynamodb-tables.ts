export default {
  XTable: {
    Type: "AWS::DynamoDB::Table",
    DeletionPolicy: "Retain",
    Properties: {
      TableName: "${self:provider.environment.DB_TABLE}",
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: "${self:custom.table_throughput}",
        WriteCapacityUnits: "${self:custom.table_throughput}",
      },
    },
  },
};
