import { MigrationInterface, QueryRunner } from "typeorm";

export class Service1731067396683 implements MigrationInterface {
    name = 'Service1731067396683'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "kline" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "symbol" varchar NOT NULL, "open_time" bigint NOT NULL, "open" decimal(18,8) NOT NULL, "high" decimal(18,8) NOT NULL, "low" decimal(18,8) NOT NULL, "close" decimal(18,8) NOT NULL, "volume" decimal(18,8) NOT NULL, "close_time" bigint NOT NULL, "quote_asset_volume" decimal(18,8) NOT NULL, "number_of_trades" integer NOT NULL, "taker_buy_base_asset_volume" decimal(18,8) NOT NULL, "taker_buy_quote_asset_volume" decimal(18,8) NOT NULL, CONSTRAINT "UQ_b41afde78b412eaae119f61efce" UNIQUE ("symbol", "open_time"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "kline"`);
    }

}
