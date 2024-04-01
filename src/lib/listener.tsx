import { Attributes } from "preact";

interface ProviderProps extends Attributes {
    children: any;
    setState: (state: any) => void;
}

export default class Provider {

    static _context: Provider = new Provider();
    private listeners: any[] = [];

    static notify(): void {
        for(let listener of Provider._context.listeners){
            listener(Math.random());
        }
    }

    static Listener(props: ProviderProps){
        Provider._context.listeners.push(props.setState);
        return ( props.children );
    }

    static addListener(listener: any){
        Provider._context.listeners.push(listener);
    }
}