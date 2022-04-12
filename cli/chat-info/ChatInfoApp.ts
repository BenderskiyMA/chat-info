import {
    IAppAccessors,
    IConfigurationExtend, IHttp, IHttpRequest, IHttpResponse,
    ILogger, IMessageBuilder, IModify, IModifyCreator, IPersistence, IRead, IRoomRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {App} from '@rocket.chat/apps-engine/definition/App';
import {IMessage} from '@rocket.chat/apps-engine/definition/messages';
import {IAppInfo} from '@rocket.chat/apps-engine/definition/metadata';
import {IRoom} from '@rocket.chat/apps-engine/definition/rooms';
import {ISlashCommand, SlashCommandContext} from '@rocket.chat/apps-engine/definition/slashcommands';
import {IUser} from '@rocket.chat/apps-engine/definition/users';

class InfoCommand implements ISlashCommand {

    public command = 'info';
    public i18nDescription = 'Команда выводит имя создателя канала.!';
    public providesPreview = false;
    public i18nParamsExample = '';

    private readonly accessors: IAppAccessors;
    private readonly applogger: ILogger;
    constructor(accessors: IAppAccessors, logger: ILogger) {
        this.accessors = accessors;
        this.applogger = logger;
        // this.applogger.debug('TEST2');
    }

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<void> {
        const creator: IModifyCreator = modify.getCreator();
        const sender: IUser = (await read.getUserReader().getAppUser()) as IUser;
        const room: IRoom = context.getRoom();
        // const roomRead: IRoomRead = this.accessors.reader.getRoomReader();
        const moderators: Array<string> = await this.getuserlist(room.id, 'moderator', http);
        const owners: Array<string> = await this.getuserlist(room.id, 'owner', http);
        let msgText: string;
        if ((room.type === 'p') && (room.displayName) && (room.creator)) {
            msgText = 'Канал *"' + room.displayName + '"* был создан @' + room.creator?.username + '\n';
            msgText += '*Модераторы канала:*\n' ;
            for (const moder of moderators) {
                msgText += '@' + moder + '\n';
            }
            msgText += '*Владельцы канала:*\n';
            for (const owner of owners) {
                msgText += '@' + owner + '\n';
            }
        } else {
            msgText = '/info команда работает только в приватных каналах.';
        }
        const messageTemplate: IMessage = {
            text: msgText,
            sender,
            room,
        };
        const messageBuilder: IMessageBuilder = creator.startMessage(messageTemplate);
        await creator.finish(messageBuilder);
    }

    // @ts-ignore
    private async getuserlist(roomid: string, role: string, http: IHttp): Promise<Array<string>> {
        this.applogger.debug('Start: roomid=', roomid, ' role=', role, ';');
        const response: IHttpResponse = await http.get( 'http://192.168.1.249:3000/api/v1/roles.getUsersInRole?role=' + role + '&roomId=' + roomid , {
            // tslint:disable-next-line:max-line-length
            headers : {'Content-Type' : 'application/json' , 'X-Auth-Token' : '' , 'X-User-Id' : 'XwAwpgmr385q5mYhX' },
        });
        this.applogger.debug('Stop: roomid=', roomid, ' role=', role, ';');
        let result : Array<string> = Array();
        if (response.statusCode === 200) {
            const json = JSON.parse(response.content as string);
            const users = json.users;
            for (const user of users) {
                result.push(user.username);
            }
        }
        return  result;
    }

}

// tslint:disable-next-line:max-classes-per-file
export  class ChatInfoApp extends App {
    public appLogger: ILogger;

    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
        this.appLogger = this.getLogger();

    }

    public async extendConfiguration(
        configuration: IConfigurationExtend,
    ): Promise<void> {
        // this.getLogger().debug('test3');
        const infoCommand: InfoCommand = new InfoCommand(this.getAccessors(), this.getLogger());
        await configuration.slashCommands.provideSlashCommand(infoCommand);
    }
}
