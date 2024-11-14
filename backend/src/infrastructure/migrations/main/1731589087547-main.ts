import { MigrationInterface, QueryRunner } from "typeorm";

export class Main1731589087547 implements MigrationInterface {
    name = 'Main1731589087547'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_0b7d13e380462e2bcabd746102"`);
        await queryRunner.query(`DROP INDEX "IDX_da368da5531e149a13562accf8"`);
        await queryRunner.query(`DROP INDEX "IDX_3a9c4805b0db929f4e7cbb8496"`);
        await queryRunner.query(`CREATE TABLE "temporary_exchange_credentials" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" text NOT NULL DEFAULT ('Testnet'), "api_key" varchar NOT NULL, "api_secret" varchar NOT NULL, "exchange" text NOT NULL, "user_id" integer NOT NULL, "name" text NOT NULL DEFAULT (''), CONSTRAINT "FK_0b7d13e380462e2bcabd7461028" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "temporary_exchange_credentials"("id", "type", "api_key", "api_secret", "exchange", "user_id") SELECT "id", "type", "api_key", "api_secret", "exchange", "user_id" FROM "exchange_credentials"`);
        await queryRunner.query(`DROP TABLE "exchange_credentials"`);
        await queryRunner.query(`ALTER TABLE "temporary_exchange_credentials" RENAME TO "exchange_credentials"`);
        await queryRunner.query(`CREATE INDEX "IDX_0b7d13e380462e2bcabd746102" ON "exchange_credentials" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_da368da5531e149a13562accf8" ON "exchange_credentials" ("exchange") `);
        await queryRunner.query(`CREATE INDEX "IDX_3a9c4805b0db929f4e7cbb8496" ON "exchange_credentials" ("type") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_3a9c4805b0db929f4e7cbb8496"`);
        await queryRunner.query(`DROP INDEX "IDX_da368da5531e149a13562accf8"`);
        await queryRunner.query(`DROP INDEX "IDX_0b7d13e380462e2bcabd746102"`);
        await queryRunner.query(`ALTER TABLE "exchange_credentials" RENAME TO "temporary_exchange_credentials"`);
        await queryRunner.query(`CREATE TABLE "exchange_credentials" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" text NOT NULL DEFAULT ('Testnet'), "api_key" varchar NOT NULL, "api_secret" varchar NOT NULL, "exchange" text NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "FK_0b7d13e380462e2bcabd7461028" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`INSERT INTO "exchange_credentials"("id", "type", "api_key", "api_secret", "exchange", "user_id") SELECT "id", "type", "api_key", "api_secret", "exchange", "user_id" FROM "temporary_exchange_credentials"`);
        await queryRunner.query(`DROP TABLE "temporary_exchange_credentials"`);
        await queryRunner.query(`CREATE INDEX "IDX_3a9c4805b0db929f4e7cbb8496" ON "exchange_credentials" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_da368da5531e149a13562accf8" ON "exchange_credentials" ("exchange") `);
        await queryRunner.query(`CREATE INDEX "IDX_0b7d13e380462e2bcabd746102" ON "exchange_credentials" ("user_id") `);
    }

}
