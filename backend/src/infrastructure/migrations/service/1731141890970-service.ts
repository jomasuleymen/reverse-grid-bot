import { MigrationInterface, QueryRunner } from "typeorm";

export class Service1731141890970 implements MigrationInterface {
    name = 'Service1731141890970'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_reverse_grid_bot_stats" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "buy_count" integer NOT NULL, "sell_count" integer NOT NULL, "open_price" real NOT NULL, "close_price" real NOT NULL, "highest_price" real NOT NULL, "lowest_price" real NOT NULL, "total_profit" real NOT NULL, "total_fee" real NOT NULL, "realized_pn_l" real NOT NULL, "unrealized_pn_l" real NOT NULL, "pn_l" real NOT NULL, "max_pn_l" real NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "symbol" text NOT NULL, "grid_step" real NOT NULL, "grid_volume" real NOT NULL, "start_time" integer NOT NULL, "end_time" integer NOT NULL)`);
        await queryRunner.query(`INSERT INTO "temporary_reverse_grid_bot_stats"("id", "buy_count", "sell_count", "open_price", "close_price", "highest_price", "lowest_price", "total_profit", "total_fee", "realized_pn_l", "unrealized_pn_l", "pn_l", "max_pn_l", "created_at") SELECT "id", "buy_count", "sell_count", "open_price", "close_price", "highest_price", "lowest_price", "total_profit", "total_fee", "realized_pn_l", "unrealized_pn_l", "pn_l", "max_pn_l", "created_at" FROM "reverse_grid_bot_stats"`);
        await queryRunner.query(`DROP TABLE "reverse_grid_bot_stats"`);
        await queryRunner.query(`ALTER TABLE "temporary_reverse_grid_bot_stats" RENAME TO "reverse_grid_bot_stats"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reverse_grid_bot_stats" RENAME TO "temporary_reverse_grid_bot_stats"`);
        await queryRunner.query(`CREATE TABLE "reverse_grid_bot_stats" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "buy_count" integer NOT NULL, "sell_count" integer NOT NULL, "open_price" real NOT NULL, "close_price" real NOT NULL, "highest_price" real NOT NULL, "lowest_price" real NOT NULL, "total_profit" real NOT NULL, "total_fee" real NOT NULL, "realized_pn_l" real NOT NULL, "unrealized_pn_l" real NOT NULL, "pn_l" real NOT NULL, "max_pn_l" real NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "reverse_grid_bot_stats"("id", "buy_count", "sell_count", "open_price", "close_price", "highest_price", "lowest_price", "total_profit", "total_fee", "realized_pn_l", "unrealized_pn_l", "pn_l", "max_pn_l", "created_at") SELECT "id", "buy_count", "sell_count", "open_price", "close_price", "highest_price", "lowest_price", "total_profit", "total_fee", "realized_pn_l", "unrealized_pn_l", "pn_l", "max_pn_l", "created_at" FROM "temporary_reverse_grid_bot_stats"`);
        await queryRunner.query(`DROP TABLE "temporary_reverse_grid_bot_stats"`);
    }

}
