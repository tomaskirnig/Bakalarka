import NetworkVisual from './HPVisual/NodeVisual';

export function HomePage() {
    return (
        <>
            <NetworkVisual/>
            <div id='home-page' className='div-content bg-trans-color mt-5 p-5'>
                <h1 className='display-4'>Domovská stránka</h1>
                <p>Popis / úvod</p>
            </div>
        </>
        
    )
}