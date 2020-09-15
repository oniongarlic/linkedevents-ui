import './index.scss';

import React, {Fragment, Component} from 'react';
import PropTypes from 'prop-types';

import {FormattedMessage, injectIntl} from 'react-intl';
import {Button, Modal, ModalHeader, ModalBody, Form, FormGroup} from 'reactstrap';
import {deleteImage} from 'src/actions/userImages.js';
import {connect} from 'react-redux';
import {get as getIfExists, isEmpty} from 'lodash';
import ImageEdit from '../ImageEdit';
import ImageGalleryGrid from '../ImageGalleryGrid';
import {confirmAction} from 'src/actions/app.js';
import Spinner from 'react-bootstrap/Spinner';
import {getStringWithLocale} from 'src/utils/locale';

// Display either the image thumbnail or the "Add an image to the event" text.
const PreviewImage = (props) => {
    const backgroundImage = props.backgroundImage ? props.backgroundImage : null;
    const backgroundStyle = {backgroundImage: 'url(' + backgroundImage + ')'};

    if (backgroundImage) {
        return (
            <Fragment>
                <div
                    className='image-picker--preview'
                    style={backgroundStyle}
                />
            </Fragment>
        );
    } else {
        return (
            <Fragment>
                <div
                    className='image-picker--preview'>
                    <FormattedMessage id='no-image' />
                </div>
            </Fragment>
        );
    }
};

export class ImagePicker extends Component {
    constructor(props) {
        super(props);

        this.hiddenFileInput = React.createRef();

        this.state = {
            open: true,
            edit: false,
            imageFile: null,
            thumbnailUrl: null,
            fileSizeError: false,
            isOpen: false,
        };
    }

    clickHiddenUploadInput() {
        this.hiddenFileInput.current.click();
    }

    handleExternalImage = (event) => {
        this.setState({thumbnailUrl: event.target.value});
    };

    handleExternalImageSave() {
        this.setState({edit: true, imageFile: null});
    }

    handleUpload(event) {
        const file = event.target.files[0];

        if (file && !this.validateFileSize(file)) {
            return;
        }

        const data = new FormData();

        data.append('image', file);

        if (
            file &&
            (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif')
        ) {
            this.setState({
                edit: true,
                imageFile: file,
                thumbnailUrl: window.URL.createObjectURL(file),
            });
        }
    }

    validateFileSize = (file) => {
        const maxSizeInMB = 2;

        const binaryFactor = 1024 * 1024;
        const decimalFactor = 1000 * 1000;

        const fileSizeInMB = parseInt(file.size) / decimalFactor;

        if (fileSizeInMB > maxSizeInMB) {
            this.setState({
                fileSizeError: true,
            });

            return false;
        } else {
            if (this.state.fileSizeError) {
                this.setState({
                    fileSizeError: false,
                });
            }

            return true;
        }
    };

    handleDelete(event) {
        const {editor} = this.props;
        let selectedImage = editor.values.image;
        const currentLanguage = this.props.intl.locale;
        if (!isEmpty(selectedImage)) {
            this.props.dispatch(
                confirmAction('confirm-image-delete', 'warning', 'delete', {
                    action: (e) => this.props.dispatch(deleteImage(selectedImage, this.props.user)),
                    additionalMsg: getStringWithLocale(selectedImage, 'name', currentLanguage),
                    additionalMarkup: ' ',
                })
            );
        }
    }

    handleEdit() {
        this.setState({
            edit: true,
        });
    }

    closeGalleryModal() {
        this.setState({open: false});
    }

    openGalleryModal = () => {
        this.setState({open: !this.state.open});
    };

    getModalCloseButton() {
        return (
            <Button onClick={() => this.props.close()} aria-label={this.context.intl.formatMessage({id: `close`})}><span className="glyphicon glyphicon-remove"></span></Button>
        );
    }

    render() {
        const backgroundImage = getIfExists(this.props.editor.values, 'image.url', '');
        const closebtn = this.getModalCloseButton();
        let editModal = null;

        if (this.state.edit && this.state.thumbnailUrl) {
            /* When adding a new image from hard drive */
            editModal = (
                <ImageEdit
                    imageFile={this.state.imageFile}
                    thumbnailUrl={this.state.thumbnailUrl}
                    close={() => this.setState({edit: false})}
                />
            );
        } else if (this.state.edit && !isEmpty(this.props.editor.values.image)) {
            /* When editing existing image by pressing the edit button on top of the grid */
            editModal = (
                <ImageEdit
                    id={this.props.editor.values.image.id}
                    defaultName={this.props.editor.values.image.name}
                    altText={this.props.editor.values.image.alt_text}
                    defaultPhotographerName={this.props.editor.values.image.photographer_name}
                    thumbnailUrl={this.props.editor.values.image.url}
                    license={this.props.editor.values.image.license}
                    open={this.state.edit}
                    close={() => this.setState({edit: false})}
                    updateExisting
                />
            );
        }

        return (
            <div className='image-pickers'>

                <Modal
                    className='image-picker--dialog'
                    isOpen={this.props.isOpen}
                    toggle={this.props.close}
                    size='xl'
                    role='dialog'
                    id='dialog1'
                    aria-modal='true'>

                    <ModalHeader tag='h1' close={closebtn}>
                        <FormattedMessage id='event-image-title' />
                    </ModalHeader>
                    <ModalBody>
                        <ModalHeader tag='h3' className='image-picker--dialog-title'>
                            <FormattedMessage id='use-existing-image' />
                        </ModalHeader>
                        <ImageGalleryGrid
                            editor={this.props.editor}
                            user={this.props.user}
                            images={this.props.images}
                            locale={this.props.intl.locale}
                            modal={true}
                            action={this.handleDelete}
                            close={this.props.close}
                        />
                    </ModalBody>
                </Modal>
                {editModal}
            </div>
        );
    }
}

ImagePicker.defaultProps = {
    editor: {
        values: {},
    },
    images: {},
    user: {},
    loading: true,
};

ImagePicker.propTypes = {
    editor: PropTypes.object,
    user: PropTypes.object,
    images: PropTypes.object,
    children: PropTypes.element,
    dispatch: PropTypes.func,
    loading: PropTypes.bool,
    intl: PropTypes.object,
    locale: PropTypes.string,
    isOpen: PropTypes.bool,
    close: PropTypes.func,
};

ImagePicker.contextTypes = {
    intl: PropTypes.object,
}

PreviewImage.propTypes = {
    backgroundImage: PropTypes.string,
};

const mapStateToProps = (state) => ({
    user: state.user,
    editor: state.editor,
    images: state.images,
});

export default injectIntl(connect(mapStateToProps)(ImagePicker));
