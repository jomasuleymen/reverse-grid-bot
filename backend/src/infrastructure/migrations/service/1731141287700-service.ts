import { MigrationInterface, QueryRunner } from "typeorm";

export class Service1731141287700 implements MigrationInterface {
    name = 'Service1731141287700'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "reverse_grid_bot_stats" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "buy_count" integer NOT NULL, "sell_count" integer NOT NULL, "open_price" real NOT NULL, "close_price" real NOT NULL, "highest_price" real NOT NULL, "lowest_price" real NOT NULL, "total_profit" real NOT NULL, "total_fee" real NOT NULL, "realized_pn_l" real NOT NULL, "unrealized_pn_l" real NOT NULL, "pn_l" real NOT NULL, "max_pn_l" real NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "reverse_grid_bot_stats"`);
    }

}
