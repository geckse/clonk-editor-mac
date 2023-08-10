import { Injectable } from '@angular/core';
import { ElectronService } from '../electron/electron.service';

export interface IEngineSplit {
    commands: string[];
    parameter: string[];
};

@Injectable({
    providedIn: 'root'
})
export class ClonkService {

    constructor(private electronService: ElectronService) {

    }

    startScenario(scenarioName: string) {
        const command = `${scenarioName}`;
        return this.sendC4GroupCommand(command);
    }

    sendC4GroupCommand(command: string) {
        this.electronService.sendC4groupCommand(command);
    }

    splitEngineString(engineString: string): IEngineSplit {
        const split = engineString.split(" ");

        var commands: string[] = [];
        var parameter: string[] = [];

        split.forEach(element => {
            if (element.startsWith("/")) {
                commands.push(element);
            } else {
                parameter.push(element);
            }
        });

        return {
            commands: commands,
            parameter: parameter
        } as IEngineSplit;
    }

    formatEngineString(engineSplit: IEngineSplit): string {
        var commandString = "";

        engineSplit.commands.forEach(element => {
            commandString += element.trim() + " ";
        });

        var parameterString = "";
        engineSplit.parameter.forEach(element => {
            if(element.toLocaleLowerCase() != "clonk.app"){
                parameterString += element.trim() + " ";
            }
        });
        
        return "Clonk.app " + commandString + parameterString;
    }

}
