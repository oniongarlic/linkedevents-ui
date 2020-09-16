import React from 'react';
import PropTypes from 'prop-types';
import ImageGalleryGrid from '../ImageGalleryGrid';
import ImageEdit from '../ImageEdit';

import {connect} from 'react-redux';
import {Button} from 'reactstrap';
import {FormattedMessage, injectIntl} from 'react-intl';
import ImagePickerForm from '../ImagePicker';
import {get as getIfExists} from 'lodash';
import {fetchUserImages as fetchUserImagesAction} from 'src/actions/userImages'
import classNames from 'classnames';

class ImageGallery extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            openEditModal: false,
            openOrgModal: false,
            fetchDefaults: true,
        }

        this.toggleEditModal = this.toggleEditModal.bind(this);
        this.toggleOrgModal = this.toggleOrgModal.bind(this);
    }

    componentDidMount() {
        if (this.state.fetchDefaults) {
            this.props.fetchUserImages(100,1, true);
            this.setState({fetchDefaults: false})
        }

    }

    toggleEditModal() {
        this.setState({openEditModal: !this.state.openEditModal})
    }

    toggleOrgModal() {
        this.setState({openOrgModal: !this.state.openOrgModal})
    }

    getPreview(props) {
        const backgroundImage = props.backgroundImage ? props.backgroundImage : null;
        const backgroundStyle = {backgroundImage: 'url(' + backgroundImage + ')'};

        if (backgroundImage) {
            return (
                <React.Fragment>
                    <div
                        className='image-picker--preview'
                        style={backgroundStyle}
                    />
                </React.Fragment>
            )
        } else {
            return (
                <React.Fragment>
                    <div
                        className='image-picker--preview'>
                        <FormattedMessage id='no-image'/>
                    </div>
                </React.Fragment>
            )
        }
    }

    render() {
        const backgroundImage = getIfExists(this.props.editor.values,'image.url', '');
        let editModals = this.state.openEditModal ? <ImageEdit close={this.toggleEditModal}/> : null;
        let editModal = <ImageEdit open={this.state.openEditModal} close={this.toggleEditModal}/>;
        let orgModals = this.state.openOrgModal ? <ImagePickerForm label="image-preview" name="image" loading={false} isOpen={this.state.openOrgModal} close={this.toggleOrgModal}/> : null;
        let orgModal = <ImagePickerForm label="image-preview" name="image" loading={ false} isOpen={ this.state.openOrgModal } close={this.toggleOrgModal}/>;
        const defaImages = {items: this.props.images.defaultImages};

        return (
            <React.Fragment>
                <div className='col-sm-6'>
                    <Button
                        className='image-picker--preview'
                        type='submit'
                        onClick={this.toggleEditModal}
                        style={{height: 'initial', marginBottom: '20px'}}
                    >
                        <FormattedMessage id='upload-new-image' />
                    </Button>
                    <Button
                        className='image-picker--preview'
                        type='submit'
                        onClick={this.toggleOrgModal}
                        style={{height: 'initial'}}
                    >
                        <FormattedMessage id='upload-image-select-bank' />
                    </Button>
                    <ImageEdit open={this.state.openEditModal} close={this.toggleEditModal}/>
                    <ImagePickerForm label="image-preview" name="image" loading={false} isOpen={this.state.openOrgModal} close={this.toggleOrgModal}/>
                    {true &&
                        <React.Fragment>
                            <div style={{textAlign: 'center'}}>
                                <FormattedMessage id='select-from-default'>{txt => <h3>{txt}</h3>}</FormattedMessage>
                            </div>
                            <ImageGalleryGrid
                                user={this.props.user}
                                editor={this.props.editor}
                                images={defaImages}
                                locale={'fi'}
                            />
                            <hr />
                        </React.Fragment>
                    }

                </div>
                <div className='col-sm-6 side-field'>
                    <div className={classNames('image-picker', {'background': backgroundImage})}>
                        {this.getPreview({backgroundImage: backgroundImage})}
                    </div>
                </div>
            </React.Fragment>
        )
    }
}


ImageGallery.propTypes = {
    user: PropTypes.object,
    editor: PropTypes.object,
    images: PropTypes.object,
    fetchUserImages: PropTypes.func,
};

const mapDispatchToProps = (dispatch) => ({
    fetchUserImages: (user, amount, pageNumber, mainPage) => dispatch(fetchUserImagesAction(user, amount, pageNumber, mainPage)),
});

const mapStateToProps = (state) => ({
    images: state.images,
    user: state.user,
    editor: state.editor,
});

export default connect(mapStateToProps, mapDispatchToProps)(ImageGallery)




