import { ZONE_NAME } from "./stage";

export const zone = aws.route53.getZoneOutput({ name: ZONE_NAME });

export function route53Cname(args: {
  name: string;
  recordName: string;
  target: $util.Input<string>;
}): aws.route53.Record {
  return new aws.route53.Record(args.name, {
    zoneId: zone.zoneId,
    name: args.recordName,
    type: "CNAME",
    ttl: 60,
    records: [args.target],
  });
}
