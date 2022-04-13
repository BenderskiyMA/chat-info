import {
    IAppAccessors,
    IConfigurationExtend, IHttp, IHttpRequest, IHttpResponse,
    ILogger, IMessageBuilder, IModify, IModifyCreator, IPersistence, IRead, IRoomRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {App} from '@rocket.chat/apps-engine/definition/App';
import {IMessage} from '@rocket.chat/apps-engine/definition/messages';
import {IAppInfo} from '@rocket.chat/apps-engine/definition/metadata';
import {IRoom} from '@rocket.chat/apps-engine/definition/rooms';
import {SettingType} from '@rocket.chat/apps-engine/definition/settings';
import {ISlashCommand, SlashCommandContext} from '@rocket.chat/apps-engine/definition/slashcommands';
import {IUser} from '@rocket.chat/apps-engine/definition/users';

class InfoCommand implements ISlashCommand {

    public command = 'info';
    public i18nDescription = 'Команда выводит имя создателя, владельца и модераторов канала.';
    public providesPreview = true;
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
        const token: string = await this.accessors.reader.getEnvironmentReader().getSettings().getValueById('id_info_setting_token');
        const userid: string = await this.accessors.reader.getEnvironmentReader().getSettings().getValueById('id_info_setting_uid');
        const moderators: Array<string> = await this.getuserlist(room.id, 'moderator', http, token, userid);
        const owners: Array<string> = await this.getuserlist(room.id, 'owner', http, token, userid);
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
    private async getuserlist(roomid: string, role: string, http: IHttp, token: string, userid: string): Promise<Array<string>> {
        this.applogger.debug('Start: roomid=', roomid, ' role=', role, ';');
        const response: IHttpResponse = await http.get( 'http://192.168.1.249:3000/api/v1/roles.getUsersInRole?role=' + role + '&roomId=' + roomid , {
            // tslint:disable-next-line:max-line-length
            headers : {'Content-Type' : 'application/json' , 'X-Auth-Token' : token , 'X-User-Id' : userid },
        });
        this.applogger.debug('Stop: roomid=', roomid, ' role=', role, ';');
        let result : Array<string> = Array();
        if (response.statusCode === 200) {
            const json = JSON.parse(response.content as string);
            if ((json.success === 'true') && (json.total > 0)) {
                const users = json.users;
                for (const user of users) {
                    result.push(user.username);
                }
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
        await configuration.settings.provideSetting({
            i18nLabel: 'user_token', packageValue: '', public: false, required: true, type: SettingType.STRING, id: 'id_info_setting_token',
        });
        await configuration.settings.provideSetting({
            i18nLabel: 'user_id', packageValue: '', public: false, required: true, type: SettingType.STRING, id: 'id_info_setting_uid',
        });
    }
}
