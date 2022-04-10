import {
    IAppAccessors,
    IConfigurationExtend, IHttp,
    ILogger, IMessageBuilder, IModify, IModifyCreator, IPersistence, IRead, IRoomRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {App} from '@rocket.chat/apps-engine/definition/App';
import {IMessage} from '@rocket.chat/apps-engine/definition/messages';
import {IAppInfo} from '@rocket.chat/apps-engine/definition/metadata';
import {IRoom} from '@rocket.chat/apps-engine/definition/rooms';
import {ISlashCommand, SlashCommandContext} from '@rocket.chat/apps-engine/definition/slashcommands';
import {IUser} from '@rocket.chat/apps-engine/definition/users';
import {IPermission} from "@rocket.chat/apps-engine/definition/permissions/IPermission";


class InfoCommand implements ISlashCommand {
    private readonly accessors: IAppAccessors;
    constructor(accessors: IAppAccessors) {
        this.accessors = accessors;
    }
    public command = 'info';
    public i18nDescription = 'Just says Hello to the World!';
    public providesPreview = false;
    public i18nParamsExample = '';

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
        const roomRead: IRoomRead = this.accessors.reader.getRoomReader();
        let msgText: string = room.displayName + ', Creator is ' + room.creator.username + ', Members are: ';
        const users = await roomRead.getMembers(room.id);
        for (const user of users) {
            msgText += user.username + ' ['  + user.id + '],  ';
        }
        const messageTemplate: IMessage = {
            text: msgText,
            sender,
            room,
        };
        const messageBuilder: IMessageBuilder = creator.startMessage(messageTemplate);
        await creator.finish(messageBuilder);
    }
}

// tslint:disable-next-line:max-classes-per-file
export  class ChatInfoApp extends App {
    private readonly appLogger: ILogger;
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
        this.appLogger = logger;
    }

    public async extendConfiguration(
        configuration: IConfigurationExtend,
    ): Promise<void> {
        const infoCommand: InfoCommand = new InfoCommand(this.getAccessors());
        await configuration.slashCommands.provideSlashCommand(infoCommand);
    }
}
