'use client';

import { useState, createContext } from 'react';

const CategoryContext = createContext();

const CategoryProvider = ({ children }) => {
    const [categoryData, setCategoryData] = useState([]);
    const [isEdit, setIsEdit] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: false,
    });




    return (
        <CategoryContext.Provider value={{ formData, categoryData, setIsEdit, isEdit, setCategoryData, setFormData,  }}>
            {children}
        </CategoryContext.Provider>
    );
};

export { CategoryProvider, CategoryContext };
