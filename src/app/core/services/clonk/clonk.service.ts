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

    /**
     * Starts a scenario by sending a command to the C4Group.
     * @param scenarioName - The name of the scenario to start.
     * @returns The result of the sendC4GroupCommand method.
     */
    startScenario(scenarioName: string) {
        const command = `${scenarioName}`;
        return this.sendClonkAppCommand(command);
    }

    /**
     * Sends a command to the C4Group via the Electron service.
     * @param command - The command string to be sent.
     */
    sendC4GroupCommand(command: string) {
       return this.electronService.sendC4groupCommand(command);
    }

    /**
     * Sends a command to the Clonk.app via the Electron service.
     * @param command - The command string to be sent.
     */
    sendClonkAppCommand(command: string) {
       return this.electronService.sendClonkAppCommand(command);
    }

    /**
     * Splits an engine string into commands and parameters.
     * @param engineString - The engine string to be split.
     * @returns An object containing the commands and parameters.
     */
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

    /**
     * Formats an engine split object into a single engine string.
     * @param engineSplit - The object containing commands and parameters to be formatted.
     * @returns A formatted engine string.
     */
    formatEngineString(engineSplit: IEngineSplit): string {
        var commandString = "";

        engineSplit.commands.forEach(element => {
            commandString += element.trim() + " ";
        });

        var parameterString = "";
        engineSplit.parameter.forEach(element => {
            if (element.toLocaleLowerCase() != "clonk.app") {
                parameterString += element.trim() + " ";
            }
        });

        return "Clonk.app" + (commandString != "" ? " " + commandString.trim() : "") + (parameterString != "" ? " " + parameterString.trim() : "");
    }

    /**
     * unpacks a C4Group file by sending a command to the C4Group.
     * @param file - The file to explode. Should be one of .c4d, .c4s, .c4g.
     * @returns The result of the sendC4GroupCommand method.
     */
    async unpackFile(file: string): Promise<any> {
        const command = `${file} -u`;
        if (!file.endsWith(".c4d") && !file.endsWith(".c4s") && !file.endsWith(".c4g") && !file.endsWith(".c4f") && !file.endsWith(".c4p")) {
            throw new Error("Invalid file type. File must be a .c4d, .c4s, .c4g, .c4f or .c4p file.");
        }
        console.log("UNPACK:", command);
        return this.sendC4GroupCommand(command);
    }

    /**
     * Implodes a C4Group file by sending a command to the C4Group.
     * @param path - The path to the unpacked folder to implode.
     * @returns The result of the sendC4GroupCommand method.
     */
    async packFile(path: string): Promise<any> {
        const command = `${path} -p`;
        if (!path.endsWith(".c4d") && !path.endsWith(".c4s") && !path.endsWith(".c4g") && !path.endsWith(".c4f") && !path.endsWith(".c4p")) {
            throw new Error("Invalid file type. File must be a .c4d, .c4s, .c4g, .c4f or .c4p file.");
        }
        return this.sendC4GroupCommand(command);
    }

    /**
     * Checks if a file can be packed by C4Group based on its file extension.
     * @param file - The file name or path to check.
     * @returns A boolean indicating whether the file can be packed.
     */
    canPack(file: string): boolean {
        const packableExtensions = ['.c4d', '.c4s', '.c4g', '.c4f', '.c4p'];
        const fileExtension = file.substring(file.lastIndexOf('.')).toLowerCase();
        return packableExtensions.includes(fileExtension);
    }

}
