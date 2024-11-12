import { MigrationInterface, QueryRunner } from "typeorm";

export class Service1731447677246 implements MigrationInterface {
    name = 'Service1731447677246'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_b943ad40580870e10d36841641" ON "kline" ("open_time") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4d60ab36d1748372d474184c0" ON "kline" ("close_time") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_f4d60ab36d1748372d474184c0"`);
        await queryRunner.query(`DROP INDEX "IDX_b943ad40580870e10d36841641"`);
    }

}
