import {
    IAppAccessors,
    IConfigurationExtend, IHttp,
    ILogger, IModify, IPersistence, IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {App} from '@rocket.chat/apps-engine/definition/App';
import {IAppInfo} from '@rocket.chat/apps-engine/definition/metadata';
import {IRoom} from '@rocket.chat/apps-engine/definition/rooms';
import {ISlashCommand, SlashCommandContext} from '@rocket.chat/apps-engine/definition/slashcommands';
import {IUser} from '@rocket.chat/apps-engine/definition/users';

class InfoCommand implements ISlashCommand {

    public command = 'info';
    public i18nDescription = 'Команда выводит имя создателя, владельца и модераторов канала.';
    public providesPreview = true;
    public i18nParamsExample = 'Параметры не требуются';
    public i18nChannelWord = 'Канал';
    public i18nModerators = 'Модераторы канала';
    public i18nOwners = 'Владельцы канала';
    public i18nCreator = 'Создатель канала';
    public i18nWorkingOnlyInPrivate = 'команда работает только в приватных каналах';
    public i18nCreatorNameNotSet = 'не установлен';

    private readonly accessors: IAppAccessors;
    private readonly applogger: ILogger;
    constructor(accessors: IAppAccessors, logger: ILogger) {
        this.accessors = accessors;
        this.applogger = logger;
    }

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence,
    ): Promise<void> {
        const room: IRoom = context.getRoom();
        const moderators: Array<IUser> = await read.getRoomReader().getModerators(room.id);
        const owners: Array<IUser> = await read.getRoomReader().getOwners(room.id);
        let msgText: string;
        if ((room.type === 'p') && (room.displayName)) {
            let creatorName: string = this.i18nCreatorNameNotSet;
            if (room.creator) {
                creatorName = room.creator.username;
            }
            msgText = this.i18nChannelWord + ' *"' + room.displayName + '"* \n*' + this.i18nCreator + '*:\n @' + creatorName + '\n';
            msgText += '*' + this.i18nModerators + ':*\n';
            for (const moder of moderators) {
                msgText += '@' + moder.username + '\n';
            }
            msgText += '*' + this.i18nOwners + ':*\n';
            for (const owner of owners) {
                msgText += '@' + owner.username + '\n';
            }
        } else {
            msgText = '/info ' + this.i18nWorkingOnlyInPrivate + '.';
        }
        const msg = modify.getCreator().startMessage().setText(msgText)
            .setRoom(context.getRoom()).setSender(context.getSender()).getMessage();
        return await modify.getNotifier().notifyUser(context.getSender(), msg);
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
        const infoCommand: InfoCommand = new InfoCommand(this.getAccessors(), this.getLogger());
        await configuration.slashCommands.provideSlashCommand(infoCommand);
    }
}
