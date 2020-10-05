jest.mock('../../utils/events', () => {
    const EventQueryParams = jest.requireActual('../../utils/events');
    const eventAllLanguages = (num) => ({name:{fi:'suomi',sv:'svenska', en:'english'}, id: num});
    const eventFinnishAndSwedish = (num) => ({name:{fi:'suomi',sv:'svenska'}, id: num});
    const eventFinnishAndEnglish = (num) => ({name:{fi:'suomi',en:'english'}, id: num});
    const eventSwedishAndEnglish = (num) => ({name:{sv:'svenska',en:'english'}, id: num});
    const events = [];
    for (let i = 0; i < 5; i++) {
        events.push(eventFinnishAndSwedish(i + 1));
    }
    for (let i = 0; i < 10; i++) {
        events.push(eventFinnishAndEnglish(i  + 10))
    }
    for (let i = 0; i < 3; i++) {
        events.push(eventSwedishAndEnglish(i  + 100))
    }
    for (let i = 0; i < 4; i++) {
        events.push(eventAllLanguages(i + 6))
    }
    return {
        __esModule: true,
        ...EventQueryParams,
        fetchEvents: jest.fn().mockImplementation(() => {
            return new Promise(((resolve, reject) => {
                resolve({
                    data: {
                        data: events,
                        meta: {
                            count: 111,
                        },
                    },
                });
            }))})};
});

import configureStore from 'redux-mock-store'
import React from 'react'
import thunk from 'redux-thunk'
import {shallow} from 'enzyme'
import {IntlProvider, FormattedMessage} from 'react-intl';
import {Input} from 'reactstrap';
import testReduxIntWrapper from '../../../__mocks__/testReduxIntWrapper'
import ConnectedEventListing, {EventListing} from './index'
import {mockCurrentTime, resetMockDate} from '../../../__mocks__/testMocks';
import {mockUserEvents, mockUser} from '../../../__mocks__/mockData';


const mockStore = configureStore([thunk])
const initialStore = {
    user: {
        id: 'testuser',
        username: 'fooUser',
        provider: 'helsinki',
    },
    app: {
        flashMsg: null,
        confirmAction: null,
    },
}

const mockUserAdmin = mockUser;
mockUserAdmin.userType = 'admin';

const defaultProps = {
    user: mockUserAdmin,
    eventLanguages: ['all','fi', 'sv', 'en'],
}

const defaultTableData = {
    events: [],
    count: null,
    fetchComplete: false,
    pageSize: 25,
    paginationPage: 0,
    sortBy: 'last_modified_time',
    sortDirection: 'desc',
}

describe('EventListing Snapshot', () => {
    let store;

    beforeEach(() => {
        mockCurrentTime('2018-11-10T12:00:00z')
    })

    afterEach(() => {
        resetMockDate()
    })

    it('should render view by default', () => {
        const componentProps = {
            login: jest.fn(),
            user: {},
        };
        const wrapper = shallow(<EventListing {...componentProps} />);
        expect(wrapper).toMatchSnapshot();
    })

    it('should render view correctly', () => {
        store = mockStore(initialStore)
        const componentProps = {
            login: jest.fn(),
        } // Props which are added to component
        const wrapper = shallow(testReduxIntWrapper(store, <ConnectedEventListing {...componentProps} />))
        expect(wrapper).toMatchSnapshot()
    })
})

describe('EventListing', () => {
    function getWrapper(props) {
        return shallow(<EventListing {...defaultProps} {...props}/>);
    }

    describe('render when not logged in', () => {
        const wrapper = getWrapper({user: null})
        const inputelement = wrapper.find(Input)
        const formattedelement = wrapper.find(FormattedMessage)

        test('no radio-inputs without user permissions', () => {
            expect(inputelement).toHaveLength(0);
        })

        test('correct amount of FormattedMessages without user permissions', () => {
            expect(formattedelement).toHaveLength(3);
        })
    })

    describe('render when logged in', () => {
        const wrapper = getWrapper()
        const formattedelement = wrapper.find(FormattedMessage)
        const instance = wrapper.instance();

        test('contains radio-inputs with correct props', () => {
            const inputelement = wrapper.find('.user-events-filter').find(Input)
            expect(inputelement).toHaveLength(4);
            inputelement.forEach((Input, index) => {
                expect(Input.prop('value')).toBe(defaultProps.eventLanguages[index])
                expect(Input.prop('type')).toBe('radio')
                expect(Input.prop('onChange')).toBe(instance.toggleEventLanguages);
            })
        })

        test('contains user-input with correct props', () => {
            const userinput = wrapper.find('.user-events-toggle').find(Input)
            expect(userinput).toHaveLength(1);

            expect(userinput.prop('type')).toBe('checkbox');
            expect(userinput.prop('onChange')).toBe(instance.toggleUserEvents);
        })

        test('correct amount of FormattedMessages', ()=> {
            expect(formattedelement).toHaveLength(8)
        })
    })

    describe('handlers', () => {

        test('sets value for state.showContentLanguage according to event.target.value', () => {
            const wrapper = getWrapper()
            const event = (lang) => ({target: {value: lang}});

            expect(wrapper.state('showContentLanguage')).toBe('')
            wrapper.instance().toggleEventLanguages(event('fi'))
            expect(wrapper.state('showContentLanguage')).toBe('fi'); 
        })

        test('sets state for showCreatedByUser according to event.target.checked', () => {
            const wrapper = getWrapper()
            const checked = (bool) => ({target: {checked: bool}})

            expect(wrapper.state('showCreatedByUser')).toBe(false)
            wrapper.instance().toggleUserEvents(checked(true))
            expect(wrapper.state('showCreatedByUser')).toBe(true)
        })
    })
    describe('data', () => {

        test('correct default state for tableData', () => {
            const wrapper = getWrapper()
            expect(wrapper.state('tableData')).toEqual({...defaultTableData});
        })

        test('tableData contains events that have english content', async () => {
            const element = getWrapper({user: mockUserAdmin});
            const instance = element.instance();
            element.setState({showContentLanguage: 'en'});
            await instance.fetchTableData();
            const StatetableData = element.state('tableData');
            const tableDataEvents = StatetableData.events;
            tableDataEvents.forEach((event) => {
                expect(Object.keys(event.name)).toContain('en');
            })
        })
        test('tableData contains events that have swedish content', async () => {
            const element = getWrapper({user: mockUserAdmin});
            const instance = element.instance();
            element.setState({showContentLanguage: 'sv'});
            await instance.fetchTableData();
            const StatetableData = element.state('tableData');
            const tableDataEvents = StatetableData.events;
            tableDataEvents.forEach((event) => {
                expect(Object.keys(event.name)).toContain('sv');
            })
        })
        test('handleSortChange', async () => {
            const wrapper = getWrapper()
            const instance = wrapper.instance();
            await instance.handleSortChange();
            const results = wrapper.state('tableData')
            expect(wrapper.state('tableData')).toBe('results');
        })
        test('handlePageChange', async () => {
            const wrapper = getWrapper()
            const instance = wrapper.instance()
            await instance.handlePageChange()
            const results = wrapper.state('tableData')
            expect(wrapper.state('tableData')).toBe('results');
        })
        test('handlePageSizeChange', async () => {
            const page = (pageSize) => ({target: {value: pageSize}});
            const wrapper = getWrapper()
            const instance = wrapper.instance()
            await instance.handlePageSizeChange(page(10))
            const results = wrapper.state('tableData')
            expect(wrapper.state('tableData')).toBe(results);
        })
    })
})



