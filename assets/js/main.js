/*==================== SHOW MENU ====================*/
const showMenu = (toggleId, navId) =>{
    const toggle = document.getElementById(toggleId),
    nav = document.getElementById(navId)
    
    // Validate that variables exist
    if(toggle && nav){
        toggle.addEventListener('click', ()=>{
            // We add the show-menu class to the div tag with the nav__menu class
            nav.classList.toggle('show-menu')
        })
    }
}
showMenu('nav-toggle','nav-menu')

/*==================== REMOVE MENU MOBILE ====================*/
const navLink = document.querySelectorAll('.nav__link')

function linkAction(){
    const navMenu = document.getElementById('nav-menu')
    // When we click on each nav__link, we remove the show-menu class
    navMenu.classList.remove('show-menu')
}
navLink.forEach(n => n.addEventListener('click', linkAction))

/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
const sections = document.querySelectorAll('section[id]')

function scrollActive(){
    const scrollY = window.pageYOffset

    sections.forEach(current =>{
        const sectionHeight = current.offsetHeight
        const sectionTop = current.offsetTop - 50;
        const sectionId = current.getAttribute('id')
        const link = document.querySelector('.nav__menu a[href*=' + sectionId + ']')

        if(!link) return

        if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight){
            link.classList.add('active-link')
        }else{
            link.classList.remove('active-link')
        }
    })
}
window.addEventListener('scroll', scrollActive)

/*==================== SHOW SCROLL TOP ====================*/ 
function scrollTop(){
    let scrollTop = document.getElementById('scroll-top');
    // When the scroll is higher than 560 viewport height, add the show-scroll class to the a tag with the scroll-top class
    if(this.scrollY >= 200) scrollTop.classList.add('show-scroll'); else scrollTop.classList.remove('show-scroll')
}
window.addEventListener('scroll', scrollTop)

/*==================== DARK LIGHT THEME ====================*/ 
const themeButton = document.getElementById('theme-button')
const darkTheme = 'dark-theme'
const iconTheme = 'bx-sun'

// Previously selected topic (if user selected)
const selectedTheme = localStorage.getItem('selected-theme')
const selectedIcon = localStorage.getItem('selected-icon')

// We obtain the current theme that the interface has by validating the dark-theme class
const getCurrentTheme = () => document.body.classList.contains(darkTheme) ? 'dark' : 'light'
const getCurrentIcon = () => themeButton.classList.contains(iconTheme) ? 'bx-moon' : 'bx-sun'

// We validate if the user previously chose a topic
if (selectedTheme) {
  // If the validation is fulfilled, we ask what the issue was to know if we activated or deactivated the dark
  document.body.classList[selectedTheme === 'dark' ? 'add' : 'remove'](darkTheme)
  themeButton.classList[selectedIcon === 'bx-moon' ? 'add' : 'remove'](iconTheme)
}

// Activate / deactivate the theme manually with the button
themeButton.addEventListener('click', () => {
    // Add or remove the dark / icon theme
    document.body.classList.toggle(darkTheme)
    themeButton.classList.toggle(iconTheme)
    // We save the theme and the current icon that the user chose
    localStorage.setItem('selected-theme', getCurrentTheme())
    localStorage.setItem('selected-icon', getCurrentIcon())
})


/*==================== GENERATE PDF ====================*/ 
// PDF generated area
let areaCv = document.getElementById('area-cv');

let resumeButton = document.getElementById('resume-button');

// Html2pdf options
let opt = {
    margin:       0,
    filename:     'myResume.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
    jsPDF:        { format: 'a4', orientation: 'portrait', unit: 'mm' },
    pagebreak:    { mode: ['css', 'legacy'] }
}

function waitForNextFrame(){
    return new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve)
        })
    })
}

function waitForImages(container){
    const images = Array.from(container.querySelectorAll('img'))

    return Promise.all(images.map(image => {
        if (image.complete) return Promise.resolve()

        return new Promise(resolve => {
            image.addEventListener('load', resolve, { once: true })
            image.addEventListener('error', resolve, { once: true })
        })
    }))
}

function createPdfClone(){
    const resumeWidth = Math.ceil(areaCv.getBoundingClientRect().width)
    const a4Height = Math.ceil((resumeWidth * 297) / 210)

    const exportRoot = document.createElement('div')
    exportRoot.className = 'pdf-export-root'

    const exportContainer = document.createElement('div')
    exportContainer.className = 'bd-container'
    exportContainer.style.width = `${resumeWidth}px`
    exportContainer.style.maxWidth = `${resumeWidth}px`

    const clone = areaCv.cloneNode(true)

    clone.querySelectorAll('.generate-pdf, .change-theme, .home__button-movil').forEach(element => {
        element.style.display = 'none'
    })

    exportContainer.appendChild(clone)
    exportRoot.appendChild(exportContainer)
    document.body.appendChild(exportRoot)

    // Use a small tolerance so we don't create an extra blank page
    // just because of a few pixels of rendering difference.
    const pageTolerance = 12
    const pageCount = Math.min(2, Math.max(1, Math.ceil((clone.scrollHeight - pageTolerance) / a4Height)))
    const exportHeight = pageCount * a4Height
    clone.style.minHeight = `${exportHeight}px`
    clone.style.height = `${exportHeight}px`
    clone.style.maxHeight = `${exportHeight}px`
    clone.style.overflow = 'hidden'

    return { exportRoot, clone }
}

async function generateResume(){
    if (!window.html2pdf || !areaCv) {
        throw new Error('html2pdf is not available')
    }

    const { exportRoot, clone } = createPdfClone()

    try {
        await waitForImages(exportRoot)
        await waitForNextFrame()
        opt.html2canvas.windowWidth = exportRoot.scrollWidth
        const worker = html2pdf().set(opt).from(clone).toPdf()

        try {
            const pdf = await worker.get('pdf')
            const getPageCount = () => {
                if (pdf && pdf.internal && typeof pdf.internal.getNumberOfPages === 'function') {
                    return pdf.internal.getNumberOfPages()
                }

                if (pdf && Array.isArray(pdf.internal?.pages)) {
                    return Math.max(0, pdf.internal.pages.length - 1)
                }

                if (pdf && typeof pdf.getNumberOfPages === 'function') {
                    return pdf.getNumberOfPages()
                }

                return null
            }

            if (
                pdf &&
                typeof pdf.deletePage === 'function' &&
                typeof pdf.save === 'function'
            ) {
                let pageCount = getPageCount()

                while (pageCount && pageCount > 2) {
                    pdf.deletePage(pageCount)
                    pageCount = getPageCount()
                }

                pdf.save(opt.filename)
                return
            }
        } catch (trimError) {
            console.error('PDF page trimming failed, falling back to standard save:', trimError)
        }

        await html2pdf().set(opt).from(clone).save()
    } finally {
        exportRoot.remove()
    }
}

// When the button is clicked, it executes the three functions
if (resumeButton && areaCv) {
    resumeButton.addEventListener('click', async () =>{
        if (resumeButton.classList.contains('is-generating')) return

        resumeButton.classList.add('is-generating')

        try {
            await generateResume()
        } catch (error) {
            console.error('PDF generation failed:', error)
        } finally {
            resumeButton.classList.remove('is-generating')
        }
    })
}
