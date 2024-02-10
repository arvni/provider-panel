import {router, useForm} from "@inertiajs/react";
import {useEffect, useRef, useState} from "react";
import axios from "axios";

export const useSubmitForm = (defaultValues, route) => {
    const {
        data,
        setData,
        post,
        processing,
        setError,
        errors,
        clearErrors,
        reset,
        wasSuccessful,
    } = useForm(defaultValues);
    const submit = (options) => {
        if (typeof route === "string") {
            post(route, options);
        }
    }
    const handleChange = (e) => {
        if (e && typeof e !== "string")
            setData(e.target.name, e.target.type == "checkbox" ? e.target.checked : e.target.value);
    }

    return {
        data,
        post,
        setData,
        processing,
        submit,
        setError,
        errors,
        clearErrors,
        handleChange,
        reset,
        wasSuccessful
    };
}

export const uploadFiles = (url) => {
    const [progress, setProgress] = useState(0);
    const upload = (file) => {
        let formData = new FormData();
        formData.set("file", file);
        return axios.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (e) => setProgress(e.progress ?? 0)
        })
    }
    const resetProgress = () => setProgress(0);
    return {progress, upload, resetProgress}
}

export const useChangePage = () => {
    const {processing, get: goto} = useForm();
    const get = (url) => goto(url);
    return {
        processing, get
    }
}


export const usePageReload = (request, only = []) => {
    const [data, setData] = useState(request);
    const firstUpdate = useRef(true);
    const [processing, setProcessing] = useState(false);
    const reload = () => router.reload({
        only,
        data,
        onStart: activateProcessing,
        onFinish: deactivateProcessing
    });
    useEffect(() => {
        if (firstUpdate.current) {
            firstUpdate.current = false;
            return;
        }
        reload();
    }, [data]);
    const onPageChange = (event, page) => {
        setData((prevData) => ({...prevData, page}));
    };
    const onPageSizeChange = (pageSize) => {
        setData((prevData) => ({...prevData, pageSize}));
    };
    const onFilterChange = (e) => {
        const {name, value} = e.target;
        let filters = changeObjectWithNestedName(name, value, data?.filters ?? {});
        if (JSON.stringify(filters) !== JSON.stringify(data.filters))
            setData((prevData) => ({
                ...prevData,
                page: 1,
                filters
            }));
    };
    const onOrderByChange = (field, type) => {
        setData((prevData) => ({...prevData, sort: {field, type}}));
    };
    const get = (url) => {
        router.visit(url, {
            onStart: activateProcessing,
            onFinish: deactivateProcessing,
        })
    }
    const activateProcessing = () => {
        setProcessing(true);
    }
    const deactivateProcessing = () => {
        setProcessing(false);
    }


    return {processing, reload, get, data, setData, onPageChange, onPageSizeChange, onFilterChange, onOrderByChange}
}

export const useGetData = () => {
    const [loading, setLoading] = useState(false);

    async function getData(url, query) {
        setLoading(true);
        if (query) {
            url += "?" + new URLSearchParams(query).toString();
        }
        return axios.get(url).then(({data}) => {
            setLoading(false);
            return data;
        });
    }

    return {getData, loading};
}

export const useDelete = () => {
    const {post, processing} = useForm({_method: "delete"});
    return {submit: post, processing}
}


function changeObjectWithNestedName(name, value, prevValues) {
    const output = {...prevValues}, nestedProperties = name.split("."),
        lastPart = nestedProperties.pop();
    let currentObject = output;
    for (let i = nestedProperties.length - 1; i >= 0; i--) {
        if (nestedProperties[i]) {
            const property = nestedProperties[i];
            if (!currentObject[property]) {
                currentObject[property] = {};
            }
            currentObject = currentObject[property];
        }
    }
    if (lastPart)
        currentObject[lastPart] = value;
    return output;
}

export async function fetcher(resource) {
    let result;
    try {
        result = await fetch(resource);
    } catch (e) {
        console.log('***** Problem with fetch that results in an exception');
        console.error(e);
        throw new Error('Invalid Response');
    }
    if (result.ok) {
        try {
            return await result.json();
        } catch (e) {
            console.log('***** Problem with JSON payload', e);
            throw 'Result OK but JSON broken';
        }
    } else {
        console.log('****** Result ! OK', result.status, result.statusText);
        throw result.statusText;
    }
}
