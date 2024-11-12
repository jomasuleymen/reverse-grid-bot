import { MigrationInterface, QueryRunner } from "typeorm";

export class Main1731447667286 implements MigrationInterface {
    name = 'Main1731447667286'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_f570bf2cf6dc75bddf9938961d" ON "trading_bot" ("state") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_f570bf2cf6dc75bddf9938961d"`);
    }

}
