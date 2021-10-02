import React, { useCallback } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch, useHistory } from "react-router-dom";
import { Game } from './ui/game';
import { GameRouteProps } from './ui/game/types';

// TODO refactor this out too
const Welcome = () => {

    let history = useHistory();

    const onNewGameClick = useCallback(async (e) => {
        const roomIdResponse = await fetch('/new');
        const {roomId} = await roomIdResponse.json();
        history.push(`/game/${roomId}`);
    }, [])

    return <>
        Welcome
        <button onClick={onNewGameClick}>New game</button>
    </>
}

function App() {
    return <BrowserRouter>
        <Switch>
            <Route exact path="/">
                <Welcome/>
            </Route>
            <Route exact path="/game/:roomId" render={(routeProps: GameRouteProps) => (
                <Game {...routeProps} />
            )}/>
        </Switch>
    </BrowserRouter>;
}

ReactDOM.render(<App/>, document.getElementById('root'));

