let clients: any[] = [];

export function addClient(res: any) {
    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);
    return clientId;
}

export function removeClient(id: number) {
    clients = clients.filter(client => client.id !== id);
}

export function sendProgress(data: any) {
    clients.forEach(client => {
        try {
            client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (e) {
            console.error('Failed to send progress to client', e);
        }
    });
}
