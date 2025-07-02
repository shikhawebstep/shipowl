"use client"


import { useDropshipper } from '../middleware/DropshipperMiddleWareContext'
import Banner from './Banner'

import NewlyLaunched from './NewlyLaunched'
import React, { useEffect } from 'react'

const Home = () => {
    const { verifyDropShipperAuth } = useDropshipper();
    useEffect(() => {
        verifyDropShipperAuth();
    }, [verifyDropShipperAuth]);
    return (
        <>
            <Banner />
            <NewlyLaunched />
        </>

    )
}

export default Home