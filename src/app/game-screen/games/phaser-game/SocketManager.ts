import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { GameKey } from 'src/app/models/enums/game-key';
import { GameScene } from './GameScene';

export class SocketManager {
    private sentStopped: boolean = false;
    constructor(public scene: GameScene) {}

    handleMessage = (gameMessage) => {
        if (!gameMessage || !gameMessage.type) return;

        switch (gameMessage.type) {
            case "ADD_PLAYERS":
                this.scene.playerManager.handleAddPlayers(gameMessage.players);
                break;
            case "PLAYER_MOVED":
                this.scene.playerManager.handleOtherPlayerMoved(gameMessage);
                break;
            case "PLAYER_STOPPED":
                this.scene.playerManager.handleOtherPlayerStopped(gameMessage);
                break;
            case "KILL_PLAYER" :
                this.scene.playerManager.killPlayer(gameMessage.connectionId);
                break;
        }
    }

    sendPlayerMovedMessage() {
        this.sentStopped = false;
        this.scene.gameSocket.socket$.next({
            type: "GAME_ACTION",
            gameKey: GameKey.PHASER_GAME,
            lobbyId: this.scene.gameSocket.lobbyId,
            connectionId: this.scene.gameSocket.server_connnection_id,
            gameMessage: {
                type: "PLAYER_MOVED",
                connectionId: this.scene.gameSocket.server_connnection_id,
                x: this.scene.playerManager.player.sprite.x,
                y: this.scene.playerManager.player.sprite.y
            }
        });
    }

    sendGetPlayersMessage() {
        this.scene.gameSocket.socket$.next({
            type: "GAME_ACTION",
            gameKey: GameKey.PHASER_GAME,
            lobbyId: this.scene.gameSocket.lobbyId,
            connectionId: this.scene.gameSocket.server_connnection_id,
            gameMessage: {
                type: "GET_PLAYERS",
                connectionId: this.scene.gameSocket.server_connnection_id
            }
        });
    }

    sendPlayerStoppedMessage() {
        if (this.sentStopped) return;

        this.scene.gameSocket.socket$.next({
            type: "GAME_ACTION",
            gameKey: GameKey.PHASER_GAME,
            lobbyId: this.scene.gameSocket.lobbyId,
            connectionId: this.scene.gameSocket.server_connnection_id,
            gameMessage: {
                type: "PLAYER_STOPPED",
                connectionId: this.scene.gameSocket.server_connnection_id
            }
        });

        this.sentStopped = true;
    }

    sendKillPlayerMessage(connectionId: string) {
        this.scene.gameSocket.socket$.next({
            type: "GAME_ACTION",
            gameKey: GameKey.PHASER_GAME,
            lobbyId: this.scene.gameSocket.lobbyId,
            connectionId: this.scene.gameSocket.server_connnection_id,
            gameMessage: {
                type: "KILL_PLAYER",
                connectionId: connectionId
            }
        });
    }
}