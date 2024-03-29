const knex = require("knex");

module.exports = class Database {
    static client;
    constructor(conninfo) {
        Database.client = knex(conninfo);
    }
    async init() {
        if (!(await Database.client.schema.hasTable('users'))) {
            await Database.client.schema.createTable('users', (table) => {
                table.primary('discordId');
                table.string('discordId');
                table.integer('userType'); // 0 = conglomerate, 1 = community rep, 2 = comp player, 3 = member, 4 = recruit.
                table.integer('lastPlayed'); // 0 if never, otherwise it's the unix timestamp
                table.integer('joined'); // unix timestamp
                table.boolean('warnOne');
                table.boolean('warnTwo')
            })  
        }
        if (!(await Database.client.schema.hasTable('leave'))) {
            await Database.client.schema.createTable('leave', (table) => {
                table.primary('id');
                table.increments('id');
                table.string('reason');
                table.integer('expires');
                table.string('discordId');
            })  
        }
    }

    async createUser(id, type, joined) {
        console.log(`create user with id ${id} type ${type}`)
        await Database.client('users').insert({discordId: id, lastPlayed: Date.now(), userType: type, joined: joined, warnOne: false, warnTwo: false}).onConflict('discordId').ignore();
    }

    async deleteUser(id) {
        await Database.client('users').where('discordId', id).del();
    }

    async updateLastPlayed(id, time) {
        await Database.client('users').where('discordId', id).update({lastPlayed: time});
    }

    async updateUserType(id, to) {
        await Database.client('users').where('discordId', id).update({userType: to});
    }

    async getAll() {
        return await Database.client('users').select('discordId', 'userType', 'lastPlayed', 'joined')
    }

    async createLeave(reason, expires, id) {
        return await Database.client('leave').insert({reason: reason, expires: expires, discordId: id}).returning(['id'])
    }

    async deleteLeave(id) {
        await Database.client('leave').where({id: id}).del();
    }

    async checkLeave(id) {
        let r = await Database.client('leave').where('discordId', id).select('expires')
        if (r.length < 1) {
            return false
        }

        if (r[0].expires < Date.now()) {
            return false
        }

        return true
    }

    async firstWarn(id) {
        await Database.client('users').where('discordId', id).update({warnOne: true});
    }

    async secondWarn(id) {
        await Database.client('users').where('discordId', id).update({warnTwo: true});
    }

    async clearWarn(id) {
        await Database.client('users').where('discordId', id).update({warnTwo: false, warnOne: false});
    }

    async isFirstWarned(id) {
        let r = await Database.client('users').where('discordId', id).select('warnOne')
        return r.warnOne
    }

    async isSecondWarned(id) {
        let r = await Database.client('users').where('discordId', id).select('warnTwo')
        return r.warnTwo
    }
}
