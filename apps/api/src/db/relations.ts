import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, r => ({
  countries: {
    clients: r.many.clients(),
    owners: r.many.owners(),
  },
  people: {
    employee: r.one.employees(),
    client: r.one.clients(),
    owner: r.one.owners(),
    auctioneer: r.one.auctioneers(),
  },
  employees: {
    person: r.one.people({
      from: r.employees.id,
      to: r.people.id,
    }),
    sector: r.one.sectors({
      from: r.employees.sectorId,
      to: r.sectors.id,
    }),
  },
  sectors: {
    manager: r.one.employees({
      from: r.sectors.sectorManagerId,
      to: r.employees.id,
    }),
  },
  insurances: {
    products: r.many.products(),
  },
  clients: {
    person: r.one.people({
      from: r.clients.id,
      to: r.people.id,
    }),
    country: r.one.countries({
      from: r.clients.countryId,
      to: r.countries.id,
    }),
    verifier: r.one.employees({
      from: r.clients.verifierId,
      to: r.employees.id,
    }),
    attendees: r.many.attendees(),
    auctionRecords: r.many.auctionRecords(),
    paymentMethods: r.many.paymentMethods(),
  },
  paymentMethods: {
    client: r.one.clients({
      from: r.paymentMethods.clientId,
      to: r.clients.id,
    }),
  },
  owners: {
    person: r.one.people({
      from: r.owners.id,
      to: r.people.id,
    }),
    country: r.one.countries({
      from: r.owners.countryId,
      to: r.countries.id,
    }),
    verifier: r.one.employees({
      from: r.owners.verifierId,
      to: r.employees.id,
    }),
    products: r.many.products(),
    auctionRecords: r.many.auctionRecords(),
  },
  auctioneers: {
    person: r.one.people({
      from: r.auctioneers.id,
      to: r.people.id,
    }),
    auctions: r.many.auctions(),
  },
  auctions: {
    auctioneer: r.one.auctioneers({
      from: r.auctions.auctioneerId,
      to: r.auctioneers.id,
    }),
    catalogs: r.many.catalogs(),
    attendees: r.many.attendees(),
    auctionRecords: r.many.auctionRecords(),
  },
  products: {
    reviewer: r.one.employees({
      from: r.products.reviewerId,
      to: r.employees.id,
    }),
    owner: r.one.owners({
      from: r.products.ownerId,
      to: r.owners.id,
    }),
    insurance: r.one.insurances({
      from: r.products.insurancePolicy,
      to: r.insurances.policyNumber,
    }),
    photos: r.many.photos(),
    catalogItems: r.many.catalogItems(),
    auctionRecords: r.many.auctionRecords(),
  },
  photos: {
    product: r.one.products({
      from: r.photos.productId,
      to: r.products.id,
    }),
  },
  catalogs: {
    auction: r.one.auctions({
      from: r.catalogs.auctionId,
      to: r.auctions.id,
    }),
    manager: r.one.employees({
      from: r.catalogs.managerId,
      to: r.employees.id,
    }),
    items: r.many.catalogItems(),
  },
  catalogItems: {
    catalog: r.one.catalogs({
      from: r.catalogItems.catalogId,
      to: r.catalogs.id,
    }),
    product: r.one.products({
      from: r.catalogItems.productId,
      to: r.products.id,
    }),
    bids: r.many.bids(),
  },
  attendees: {
    client: r.one.clients({
      from: r.attendees.clientId,
      to: r.clients.id,
    }),
    auction: r.one.auctions({
      from: r.attendees.auctionId,
      to: r.auctions.id,
    }),
    bids: r.many.bids(),
  },
  bids: {
    attendee: r.one.attendees({
      from: r.bids.attendeeId,
      to: r.attendees.id,
    }),
    item: r.one.catalogItems({
      from: r.bids.itemId,
      to: r.catalogItems.id,
    }),
  },
  auctionRecords: {
    auction: r.one.auctions({
      from: r.auctionRecords.auctionId,
      to: r.auctions.id,
    }),
    owner: r.one.owners({
      from: r.auctionRecords.ownerId,
      to: r.owners.id,
    }),
    product: r.one.products({
      from: r.auctionRecords.productId,
      to: r.products.id,
    }),
    client: r.one.clients({
      from: r.auctionRecords.clientId,
      to: r.clients.id,
    }),
  },
}));
